# 다시 한글이 깨지지 않도록 설정하여 Gantt 차트 다시 생성
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import matplotlib

# 한글 폰트 설정
matplotlib.rcParams['font.family'] = 'Malgun Gothic'  # Windows에서 사용할 수 있는 한글 폰트
matplotlib.rcParams['axes.unicode_minus'] = False  # 마이너스 기호 처리

# Gantt 차트 데이터
sprints = [
    {"name": "Sprint 1: 요구사항 수집", "start": "2025-04-14", "end": "2025-04-27"},
    {"name": "Sprint 2: 기본 기능 구현", "start": "2025-04-28", "end": "2025-05-11"},
    {"name": "Sprint 3: UI 및 부가 기능", "start": "2025-05-12", "end": "2025-05-25"},
    {"name": "Sprint 4: 테스트 및 배포", "start": "2025-05-26", "end": "2025-06-01"},
]

# 날짜 형식 변환
for sprint in sprints:
    sprint["start_dt"] = datetime.strptime(sprint["start"], "%Y-%m-%d")
    sprint["end_dt"] = datetime.strptime(sprint["end"], "%Y-%m-%d")

# Gantt 차트 시각화
fig, ax = plt.subplots(figsize=(10, 4))

colors = ['#4C72B0', '#55A868', '#C44E52', '#8172B2']

for i, sprint in enumerate(sprints):
    ax.barh(
        y=i,
        width=(sprint["end_dt"] - sprint["start_dt"]).days,
        left=sprint["start_dt"],
        color=colors[i],
        edgecolor='black'
    )
    ax.text(sprint["start_dt"], i, sprint["name"], va='center', ha='left', fontsize=9, color='white', weight='bold')

# 포맷 설정
ax.set_yticks(range(len(sprints)))
ax.set_yticklabels(["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4"])
ax.xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
ax.xaxis.set_major_locator(mdates.WeekdayLocator())
ax.invert_yaxis()
ax.set_title("Agile Progress Gantt Chart (04/14~06/01)", fontsize=12, weight='bold')
plt.tight_layout()

plt.grid(axis='x', linestyle='--', alpha=0.6)
plt.box(False)
plt.show()
