import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import axios from "axios";
import "../styles/DataSummary.css";
import worknetImage from "../styles/worknet.png";

// 필터 매핑 상수
const FILTER_MAPPINGS = {
    hireTypeLst: {
        R1010: "정규직", R1020: "계약직", R1030: "무기계약직", R1040: "비정규직",
        R1050: "청년인턴", R1060: "청년인턴(체험형)", R1070: "청년인턴(채용형)"
    },
    recrutSe: {
        R2010: "신입", R2020: "경력", R2030: "신입+경력", R2040: "외국인 전형"
    },
    workRgnLst: {
        R3010: "서울", R3011: "인천", R3012: "대전", R3013: "대구", R3014: "부산",
        R3015: "광주", R3016: "울산", R3017: "경기", R3018: "강원", R3019: "충남",
        R3020: "충북", R3021: "경북", R3022: "경남", R3023: "전남", R3024: "전북",
        R3025: "제주", R3026: "세종", R3030: "해외"
    },
    acbgCondLst: {
        R7010: "학력무관", R7020: "중졸이하", R7030: "고졸", R7040: "대졸(2~3년)",
        R7050: "대졸(4년)", R7060: "석사", R7070: "박사"
    },
    ncsCdLst: {
        R600001: "사업관리", R600002: "경영.회계.사무", R600003: "금융.보험", R600004: "교육.자연.사회과학",
        R600005: "법률.경찰.소방.교도.국방", R600006: "보건.의료", R600007: "사회복지.종교", R600008: "문화.예술.디자인.방송",
        R600009: "운전.운송", R600010: "영업판매", R600011: "경비.청소", R600012: "이용.숙박.여행.오락.스포츠",
        R600013: "음식서비스", R600014: "건설", R600015: "기계", R600016: "재료", R600017: "화학",
        R600018: "섬유.의복", R600019: "전기.전자", R600020: "정보통신", R600021: "식품가공",
        R600022: "인쇄.목재.가구.공예", R600023: "환경.에너지.안전", R600024: "농림어업", R600025: "연구"
    }
};

// 데이터 분석 섹션
const DataAnalysisSection = () => {
    const [selectedChart, setSelectedChart] = useState(null);
    const chartRefs = useRef({
        lineChart: null,
        barChart: null,
        radarChart: null,
        doughnutChart: null,
        bubbleChart: null
    });

    const canvasRefs = {
        lineChart: useRef(null),
        barChart: useRef(null),
        radarChart: useRef(null),
        doughnutChart: useRef(null),
        bubbleChart: useRef(null),
    };

    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchSavedData = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/local?limit=100");
                setData(response.data);
            } catch (error) {
                console.error("Error fetching saved data:", error);
            }
        };
        fetchSavedData();
    }, []);

    // 코드 값을 필터 매핑으로 변환
    const mapFilterValues = (item, field) => {
        if (FILTER_MAPPINGS[field]) {
            return item[field].split(',').map(code => FILTER_MAPPINGS[field][code] || code).join(', ');
        }
        return item[field];
    };

    useEffect(() => {
        if (data.length === 0) return;

        // 기존 차트 제거
        Object.keys(chartRefs.current).forEach((key) => {
            if (chartRefs.current[key]) {
                chartRefs.current[key].destroy();
                chartRefs.current[key] = null;
            }
        });

        // 1. Line Chart
        const quarterlyData = [0, 0, 0, 0];
        data.forEach(d => {
            if (!d.pbancBgngYmd || d.pbancBgngYmd.length < 6) return;
            const month = d.pbancBgngYmd.slice(4, 6);
            const quarter = Math.ceil(parseInt(month, 10) / 3) - 1;
            quarterlyData[quarter]++;
        });

        chartRefs.current.lineChart = new Chart(canvasRefs.lineChart.current, {
            type: "line",
            data: {
                labels: ["Q1", "Q2", "Q3", "Q4"],
                datasets: [{ label: "분기별 공고 수", data: quarterlyData, borderColor: "#4A90E2", fill: false }]
            }
        });

        // 2. Bar Chart - 지역별 공고 수
        const regionCounts = {};
        data.forEach(d => {
            mapFilterValues(d, "workRgnLst").split(',').forEach(region => {
                regionCounts[region] = (regionCounts[region] || 0) + 1;
            });
        });

        chartRefs.current.barChart = new Chart(canvasRefs.barChart.current, {
            type: "bar",
            data: {
                labels: Object.keys(regionCounts),
                datasets: [{ label: "지역별 공고 수", data: Object.values(regionCounts), backgroundColor: "#ff7b52" }]
            }
        });

        // 3. Radar Chart - 고용 형태별 공고 비율
        const hireTypeCounts = {};
        data.forEach(d => {
            mapFilterValues(d, "hireTypeLst").split(',').forEach(type => {
                hireTypeCounts[type] = (hireTypeCounts[type] || 0) + 1;
            });
        });

        chartRefs.current.radarChart = new Chart(canvasRefs.radarChart.current, {
            type: "radar",
            data: {
                labels: Object.keys(hireTypeCounts),
                datasets: [{ label: "고용형태별 공고 비율", data: Object.values(hireTypeCounts), backgroundColor: "rgba(75, 192, 192, 0.2)" }]
            }
        });

        // 4. Doughnut Chart - 학력 정보별 공고 비율
        const educationCounts = {};
        data.forEach(d => {
            mapFilterValues(d, "acbgCondLst").split(',').forEach(edu => {
                educationCounts[edu] = (educationCounts[edu] || 0) + 1;
            });
        });

        chartRefs.current.doughnutChart = new Chart(canvasRefs.doughnutChart.current, {
            type: "doughnut",
            data: {
                labels: Object.keys(educationCounts),
                datasets: [{ data: Object.values(educationCounts), backgroundColor: ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF", "#BDB2FF"] }]
            }
        });

        // 5. Bubble Chart - NCS 코드별 공고 수
        const ncsCounts = {};
        data.forEach(d => {
            mapFilterValues(d, "ncsCdLst").split(',').forEach(ncs => {
                ncsCounts[ncs] = (ncsCounts[ncs] || 0) + 1;
            });
        });

        const sortedNcs = Object.entries(ncsCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
        const colors = sortedNcs.map((_, i) => `hsl(${i * 20}, 65%, 55%)`);

        chartRefs.current.bubbleChart = new Chart(canvasRefs.bubbleChart.current, {
            type: "bubble",
            data: {
                datasets: sortedNcs.map(([ncs, count], i) => ({
                    label: ncs,
                    data: [{ x: i, y: count, r: Math.sqrt(count) * 3 }],
                    backgroundColor: colors[i]
                }))
            },
            options: {
                scales: { x: { display: false }, y: { beginAtZero: true } },
                plugins: { legend: { display: true } }
            }
        });

        return () => {
            // 컴포넌트가 언마운트될 때 차트 제거
            Object.keys(chartRefs.current).forEach((key) => {
                if (chartRefs.current[key]) {
                    chartRefs.current[key].destroy();
                    chartRefs.current[key] = null;
                }
            });
        };
    }, [data]);

    return (
        <div className="data-section">
            <div className="chart-container">
                {["lineChart", "barChart", "radarChart", "doughnutChart", "bubbleChart"].map((id) => (
                    <canvas key={id} ref={canvasRefs[id]} onClick={() => setSelectedChart(chartRefs.current[id])}></canvas>
                ))}

                {/* 워크넷 이미지 추가 */}
                <div className="worknet-image">
                    <img src={worknetImage} alt="Worknet Chart" width="280" height="280" />
                </div>
            </div>

            {/* 모달: 클릭한 차트 확대 */}
            {selectedChart && (
                <div className="modal" onClick={() => setSelectedChart(null)}>
                    <canvas
                        width={560}
                        height={560}
                        ref={(el) => {
                            if (el && selectedChart) {
                                const ctx = el.getContext("2d");
                                const chartData = selectedChart.config.data;
                                const chartType = selectedChart.config.type;

                                // 확대된 차트 그리기
                                new Chart(ctx, {
                                    type: chartType,
                                    data: chartData
                                });
                            }
                        }}
                    ></canvas>
                </div>
            )}
        </div>
    );
};

export default DataAnalysisSection;
