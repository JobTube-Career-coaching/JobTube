from fastapi import HTTPException
import requests
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled

class YouTubeService:
    def __init__(self, api_key):
        self.API_KEY = api_key
        self._latest_keyword = None
        self._is_disability_search = False
        self._is_senior_search = False

    def set_senior_search(self, is_senior: bool):
        """고령자 전용 검색 모드 설정"""
        self._is_senior_search = is_senior

    def set_disability_search(self, is_disability: bool):
        """장애인 전용 검색 모드 설정"""
        self._is_disability_search = is_disability

    def generate_category_keywords(self, keyword):
        """키워드를 세 가지 카테고리로 확장"""
        base_keyword = f"장애인 {keyword}" if self._is_disability_search and "장애인" not in keyword else f"고령자 {keyword}" if self._is_senior_search and "고령자" not in keyword else keyword
         
        categories = [
            {"id": "pros_cons", "name": "장단점", "search_terms": [f"{base_keyword} 장단점", f"{base_keyword} 특징", f"{base_keyword} 어려움"]},
            {"id": "how_to", "name": "준비방법", "search_terms": [f"{base_keyword} 되는법", f"{base_keyword} 준비", f"{base_keyword} 자격증", f"{base_keyword} 공부"]},
            {"id": "review", "name": "후기", "search_terms": [f"{base_keyword} 후기", f"{base_keyword} 경험", f"{base_keyword} 인터뷰"]}
        ]
        if "장애인" in base_keyword or "고령자" in base_keyword:
            categories = [
                {"id": "pros_cons", "name": f"{base_keyword} 관련", "search_terms": [f"{base_keyword} +재취업", f"{base_keyword} +취업 ", f"{base_keyword} +일자리"]},
            ]
        return categories

    def get_video_info(self, video_id, keyword=None, category=None):
        """
        비디오 정보를 가져오는 메서드
        keyword 파라미터와 category 파라미터 추가
        """
        videos_url = "https://www.googleapis.com/youtube/v3/videos"
        videos_params = {
            "part": "snippet,statistics",
            "id": video_id,
            "key": self.API_KEY,
        }
        
        try:
            videos_response = requests.get(videos_url, params=videos_params)
            videos_response.raise_for_status()
            videos_data = videos_response.json()

            if not videos_data.get("items"):
                raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")

            item = videos_data["items"][0]
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})

            search_keyword = keyword or self._latest_keyword

            return {
                "video_id": video_id,
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "published_at": snippet.get("publishedAt", ""),
                "description": snippet.get("description", ""),
                "thumbnails": snippet.get("thumbnails", {}),
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "view_count": int(statistics.get("viewCount", 0)),
                "like_count": int(statistics.get("likeCount", 0)),
                "tags": snippet.get("tags", []),
                "search_keyword": search_keyword,
                "category": category,
                "is_disability_content": self._is_disability_search
            }

        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"YouTube API 호출 중 오류 발생: {str(e)}")

    def search_youtube_videos_by_category(self, keyword, max_results_per_category=3):
        """카테고리별로 YouTube 비디오를 검색하는 메서드"""
        self._latest_keyword = keyword
        categories = self.generate_category_keywords(keyword)
        
        # 모든 검색된 비디오를 저장할 딕셔너리 (video_id를 키로 사용)
        all_discovered_videos = {}
        
        # 각 카테고리별 검색 결과 수집 (중복 제거 전)
        for category in categories:
            category_id = category["id"]
            
            for search_term in category["search_terms"]:
                try:
                    # 각 검색어로 검색 수행
                    search_url = "https://www.googleapis.com/youtube/v3/search"
                    search_params = {
                        "part": "snippet",
                        "q": search_term,
                        "type": "video",
                        "videoDuration": "medium",
                        "maxResults": 10,
                        "key": self.API_KEY,
                    }
                    
                    search_response = requests.get(search_url, params=search_params)
                    search_response.raise_for_status()
                    search_data = search_response.json()
                    
                    if "items" not in search_data:
                        continue

                    # 비디오 정보 가져오기
                    video_ids = [item["id"]["videoId"] for item in search_data["items"] if "videoId" in item["id"]]
                    
                    for video_id in video_ids:
                        # 이미 처리한 비디오는 건너뛰기
                        if video_id in all_discovered_videos:
                            # 이미 알고 있는 비디오라면 이 카테고리와 매칭 점수 업데이트
                            all_discovered_videos[video_id]["category_matches"].append(category_id)
                            continue
                            
                        try:
                            # 자막이 있는지 확인
                            try:
                                transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ko", "en"])
                                if not transcript:
                                    continue
                            except Exception:
                                continue
                                
                            # 비디오 정보 가져오기
                            video_info = self.get_video_info(video_id, keyword)
                            
                            # 비디오 정보에 추가 정보 설정
                            video_info["category_matches"] = [category_id]  # 이 비디오가 매칭된 카테고리들
                            
                            # 전체 비디오 목록에 추가
                            all_discovered_videos[video_id] = video_info
                            
                        except HTTPException:
                            continue
                        
                except requests.exceptions.RequestException:
                    continue
        
        # 비디오를 조회수 기준으로 정렬
        sorted_videos = sorted(
            all_discovered_videos.values(), 
            key=lambda x: x["view_count"], 
            reverse=True
        )
        
        # 결과 딕셔너리 초기화
        result = {}
        for category in categories:
            result[category["id"]] = {
                "category_name": category["name"],
                "videos": []
            }
        
        # 이미 할당된 비디오 ID를 추적
        used_video_ids = set()
        
        # 1단계: 각 카테고리에만 고유하게 일치하는 비디오 할당
        for video in sorted_videos:
            # 이 비디오가 매칭된 카테고리가 정확히 하나뿐이라면
            if len(video["category_matches"]) == 1 and len(result[video["category_matches"][0]]["videos"]) < max_results_per_category:
                category_id = video["category_matches"][0]
                video_copy = video.copy()
                video_copy["category"] = category_id  # 할당된 카테고리 설정
                result[category_id]["videos"].append(video_copy)
                used_video_ids.add(video["video_id"])
        
        # 2단계: 카테고리 우선순위에 따라 남은 비디오 할당
        # 부족한 카테고리 확인
        for category_id in [cat["id"] for cat in categories]:
            # 카테고리에 필요한 추가 비디오 수
            needed_videos = max_results_per_category - len(result[category_id]["videos"])
            
            if needed_videos <= 0:
                continue
                
            # 아직 할당되지 않은 비디오 중 이 카테고리와 일치하는 것 찾기
            matching_videos = [
                video for video in sorted_videos 
                if video["video_id"] not in used_video_ids and category_id in video["category_matches"]
            ]
            
            # 필요한 만큼 비디오 할당
            for i, video in enumerate(matching_videos):
                if i >= needed_videos:
                    break
                    
                video_copy = video.copy()
                video_copy["category"] = category_id  # 할당된 카테고리 설정
                result[category_id]["videos"].append(video_copy)
                used_video_ids.add(video["video_id"])
        
        # 3단계: 여전히 부족한 카테고리가 있다면 아직 사용되지 않은 비디오 할당
        for category_id in [cat["id"] for cat in categories]:
            # 카테고리에 필요한 추가 비디오 수
            needed_videos = max_results_per_category - len(result[category_id]["videos"])
            
            if needed_videos <= 0:
                continue
                
            # 아직 할당되지 않은 비디오
            unused_videos = [video for video in sorted_videos if video["video_id"] not in used_video_ids]
            
            # 필요한 만큼 비디오 할당
            for i, video in enumerate(unused_videos):
                if i >= needed_videos:
                    break
                    
                video_copy = video.copy()
                video_copy["category"] = category_id  # 할당된 카테고리 설정
                result[category_id]["videos"].append(video_copy)
                used_video_ids.add(video["video_id"])
        
        # 각 카테고리 내에서 조회수 기준으로 다시 정렬
        for category_id in result:
            result[category_id]["videos"].sort(key=lambda x: x["view_count"], reverse=True)
            
        return result

    def get_transcript(self, video_id):
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ko", "en"])
            if not transcript:
                raise HTTPException(status_code=404, detail="자막이 없습니다.")
            return " ".join([entry["text"] for entry in transcript])
        except (NoTranscriptFound, TranscriptsDisabled) as e:
            raise HTTPException(status_code=404, detail="자막을 사용할 수 없습니다.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"자막 처리 중 오류 발생: {str(e)}")
