from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
import openai
import re
app = FastAPI()



# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # React 앱의 URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# YouTube Data API 키
API_KEY = "secret"

# OpenAI API 키 설정
openai.api_key = "secret"



def generate_related_keywords(keyword):
    """
    직업/취업 관련 키워드를 자동으로 확장하여 반환
    """
    job_related_keywords = [ "취업", "직업", "커리어", "채용"  ]
    
    # 사용자가 입력한 키워드와 연관된 키워드를 추가
    expanded_keywords = [f"{keyword} {related}" for related in job_related_keywords]
    return expanded_keywords




def search_youtube_videos(keyword, max_results=5):
    """
    유튜브에서 키워드로 비디오 검색 후 자막 있는 영상만 필터링하여 반환
    직업 관련 연관 검색어를 포함하여 검색
    """
    import requests
    from youtube_transcript_api import YouTubeTranscriptApi

    # 연관 키워드 생성
    related_keywords = generate_related_keywords(keyword)

    # 연관 키워드를 하나씩 검색
    all_filtered_videos = []
    for related_keyword in related_keywords:
        search_url = "https://www.googleapis.com/youtube/v3/search"
        search_params = {
            "part": "snippet",
            "q": related_keyword,
            "type": "video",
            "videoDuration": "medium",  # 영상 길이를 medium으로 필터링
            "maxResults": max_results,
            "key": API_KEY,
        }
        search_response = requests.get(search_url, params=search_params)
        
        if search_response.status_code == 200:
            search_data = search_response.json()
            if "items" in search_data:
                video_ids = [item["id"]["videoId"] for item in search_data["items"] if "videoId" in item["id"]]
                
                # 비디오의 상세 정보 가져오기
                videos_url = "https://www.googleapis.com/youtube/v3/videos"
                videos_params = {
                    "part": "snippet,statistics",  # snippet과 statistics 포함
                    "id": ",".join(video_ids),
                    "key": API_KEY,
                }
                videos_response = requests.get(videos_url, params=videos_params)
                
                if videos_response.status_code == 200:
                    videos_data = videos_response.json()
                    filtered_videos = []

                    for item in videos_data["items"]:
                        video_id = item["id"]
                        snippet = item.get("snippet", {})
                        statistics = item.get("statistics", {})
                        
                        # 필요한 데이터 확인 및 필터링
                        if not snippet or not statistics:
                            continue
                        
                        # 자막 확인
                        try:
                            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ko", "en"])
                            if not transcript:
                                continue  # 자막이 없으면 필터링
                        except Exception:
                            continue  # 자막을 가져올 수 없는 경우도 필터링
                        
                        # 태그 확인 및 추가
                        video_tags = snippet.get("tags", [])
                        
                        # 좋아요와 조회수 가져오기
                        view_count = int(statistics.get("viewCount", 0))
                        like_count = int(statistics.get("likeCount", 0))

                        filtered_videos.append({
                            "video_id": video_id,
                            "title": snippet.get("title"),
                            "channel": snippet.get("channelTitle"),
                            "published_at": snippet.get("publishedAt"),
                            "description": snippet.get("description"),
                            "thumbnails": snippet.get("thumbnails"),
                            "url": f"https://www.youtube.com/watch?v={video_id}",
                            "view_count": view_count,
                            "like_count": like_count,
                            "tags": video_tags,  # 태그 정보 추가
                        })
                    
                    # 결과 저장
                    all_filtered_videos.extend(filtered_videos)
        
        else:
            raise HTTPException(status_code=search_response.status_code, detail="YouTube Search API 호출 실패")

    return all_filtered_videos



# YouTube 자막 처리
def get_transcript(video_id):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ko", "en"])
        if transcript is None:
            raise HTTPException(status_code=404, detail="No transcript available.")
        combined_text = " ".join([entry["text"] for entry in transcript])
        return combined_text
    except NoTranscriptFound:
        print("자막이 존재하지 않거나 사용할 수 없습니다.")
        return None
    except TranscriptsDisabled:
        print("영상의 자막 사용이 비활성화되었습니다.")
        return None
    except Exception as e:
        print(f"알 수 없는 오류 발생: {e}")
        return None






def preprocess_payload(payload, max_length=500):
    """
    입력 텍스트를 전처리하여 중요한 문장만 남기고 요약 모델의 입력 크기에 맞춥니다.
    """
    # 텍스트 정리
    cleaned = re.sub(r'\s+', ' ', payload)  # 불필요한 공백 제거
    cleaned = re.sub(r'[^\w\s.,!?가-힣]', '', cleaned)  # 특수문자 제거

    # 문장 단위로 나누기 (문장 끝을 구분하는 여러 구분자 사용)
    sentences = re.split(r'(?<=[.!?]) +', cleaned)

    # 텍스트 길이가 max_length를 초과하면 자르기
    if len(cleaned) > max_length:
        return " ".join(sentences[:max_length // 20])  # 문장 기준으로 자르기

    return cleaned



def summarize(payload):
    max_length = 500
    payload = preprocess_payload(payload, max_length)
    
    # First, get an overall high-level summary
    overall_prompt = (
        "다음 텍스트는 전체 내용입니다. 텍스트의 주요 주제와 핵심 내용을 간결하고 명확하게 요약해주세요. "
        "전체적인 맥락과 가장 중요한 포인트를 포함해주세요. 반드시 한글로 작성해주세요.\n"
        f"{payload}"
    )
    overall_messages = [
        {"role": "system", "content": (
            "당신은 전문가 요약가입니다. "
            "텍스트의 핵심 내용을 명확하게 요약해주세요. "
            "주요 주제와 중요한 통찰을 한글로 작성하세요."
        )},
        {"role": "user", "content": overall_prompt}
    ]
    
    # Get overall summary
    overall_response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=overall_messages
    )
    overall_summary = overall_response.choices[0].message.content.strip()
    
    # Determine main sections
    sections_prompt = (
        "다음 텍스트의 주요 섹션을 식별해주세요. 각 섹션의 핵심 주제를 간단한 제목으로 요약해주세요. 반드시 한글로 작성해주세요.\n"
        f"{payload}"
    )
    sections_messages = [
        {"role": "system", "content": (
            "텍스트에서 3~5개의 주요 섹션을 한글로 식별하세요. "
            "각 섹션의 제목은 명확하고 간결하게 작성해주세요."
        )},
        {"role": "user", "content": sections_prompt}
    ]
    
    # Get section identifications
    sections_response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=sections_messages
    )
    sections = sections_response.choices[0].message.content.strip().split('\n')
    
    # Generate detailed summaries for each section
    detailed_summaries = []
    for section in sections:
        section_prompt = (
            f"다음 텍스트에서 '{section}' 섹션에 대해 자세히 요약해주세요. "
            "이 섹션의 주요 내용, 중요한 세부사항, 핵심 포인트를 한글로 작성해주세요.\n"
            f"{payload}"
        )
        section_messages = [
            {"role": "system", "content": (
                "지정된 섹션에 대해 자세히 요약을 작성해주세요. "
                "주요 포인트와 중요한 세부사항, 핵심 통찰을 한글로 설명하세요."
            )},
            {"role": "user", "content": section_prompt}
        ]
        
        section_response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=section_messages
        )
        section_summary = section_response.choices[0].message.content.strip()
        detailed_summaries.append(f"<h3>{section}</h3>\n{section_summary}")
    
    # Combine summaries
    final_summary = f"<h2>Overall Summary</h2>\n{overall_summary}\n\n" + "\n\n".join(detailed_summaries)
    return final_summary



def postprocess_summary(summary):
    """
    요약 결과를 후처리하여 HTML 형식을 정돈합니다.
    """
    from bs4 import BeautifulSoup

    # BeautifulSoup을 사용한 HTML 검증 및 정리
    soup = BeautifulSoup(summary, "html.parser")
    for tag in soup.find_all(True):  # 모든 태그 순회
        if tag.name not in {"h3", "b", "ul", "li", "table", "tr", "th", "td"}:
            tag.unwrap()  # 허용되지 않은 태그 제거

    # 깔끔한 HTML 반환
    return str(soup.prettify())


@app.get("/search")
async def search_videos(keyword: str):
    """
    키워드로 유튜브 비디오 검색
    """
    return search_youtube_videos(keyword)

@app.get("/transcript/{video_id}")
async def get_video_transcript(video_id: str):
    transcript = get_transcript(video_id)
    summary = summarize(transcript)
    cleaned_summary = postprocess_summary(summary)
    return {"transcript": cleaned_summary}
