/*
 * 책 목록
 * - 새 책: 이 배열에 객체를 하나 더 추가하고, books/<id>/ 폴더에 cover.jpg 와 programs/ 를 넣는다.
 * - 새 프로그램: 해당 장(chapter)의 programs 배열에 항목을 추가하고 HTML 파일을 programs/ 폴더에 넣는다.
 * 자세한 방법은 README.md 참고.
 */
window.BOOKS = [
  {
    id: "how-to-lie-with-statistics",
    dir: "books/how-to-lie-with-statistics",
    cover: "cover.jpg",
    title: "새빨간 거짓말, 통계",
    original: "How to Lie with Statistics",
    author: "대럴 허프",
    translator: "박영훈",
    publisher: "청년정신",
    subject: "통계",
    intro: "표본, 평균, 오차, 그래프… 숫자가 사람을 속이는 방법을 짚어 보는 통계 교양서. 장마다 관련 개념을 직접 계산하고 실험해 보는 프로그램을 연결했다.",
    // 목차(PART 1~7)는 번역본 그대로. page = 장이 시작하는 쪽, sections = 소제목
    chapters: [
      {
        no: 1, title: "언제나 의심스러운 여론조사", page: 13,
        sections: ["예일대학 졸업생의 연평균소득", "표본 추출의 맹점", "주소불명의 예일대 졸업생들", "거짓말쟁이들", "통계적 조작",
                   "표본이 왜곡되면", "왜곡 가능성에 대한 의심", "임의추출법", "층별 임의추출법", "킨제이 보고서",
                   "질문자에 따른 왜곡된 결론", "왜곡된 결과가 나오는 이유"],
        programs: [
          {
            id: "sampling-bias", title: "표본추출의 맹점",
            file: "programs/2차시 표본추출의 맹점.html",
            type: "카드뉴스", session: "2차시", pages: "28쪽",
            summary: "1,000명에게 물으면 5천만 명의 생각을 알 수 있을까? 카드 11장과 진행 메모",
            concepts: ["전수조사", "표본조사", "모집단", "표본", "대표성", "임의추출", "편향", "표본오차"]
          }
        ]
      },
      {
        no: 2, title: "평균은 하나가 아니다", page: 43,
        sections: ["평균치로 사기치는 법", "적절한 평균값", "평균임금?", "그나마 신뢰할 수 있는 평균값"],
        programs: [
          {
            id: "average-trap", title: "평균의 함정",
            file: "programs/3차시 평균의 함정.html",
            type: "단계 활동", session: "3차시", pages: "",
            summary: "평균·중앙값·최빈값을 손으로 계산하고, 사장 월급을 움직여 이상값의 힘을 확인하는 10단계",
            concepts: ["대푯값", "평균", "중앙값", "최빈값", "이상값", "정규분포"]
          },
          {
            id: "average-salary", title: "평균급여의 속임수",
            file: "programs/3차시 평균급여의 속임수.html",
            type: "읽기 자료", session: "3차시", pages: "54~56쪽",
            summary: "같은 돈, 두 개의 발표문. 이름표와 평균에 넣는 사람을 바꾸면 숫자가 달라진다",
            concepts: ["평균", "중앙값", "이상값"]
          }
        ]
      },
      {
        no: 3, title: "작은 숫자를 생략하여 사기 치는 법", page: 61,
        sections: ["적은 인원수의 표본을 쓰는 이유", "표본의 크기에 따라 달라지는 값", "속지 않는 방법", "게젤의 준거",
                   "신문기사를 신뢰할 수 있나?", "부모들 눈 가리고 아웅하기", "그래프에 속지마라"],
        programs: [
          {
            id: "coin-lab", title: "동전 던지기 실험실",
            file: "programs/4차시 동전 던지기 실험실.html",
            type: "실험", session: "4차시", pages: "68쪽",
            summary: "10번 vs 1,000번. 혼자, 그리고 30명이 동전을 던져 보며 큰 수의 법칙 확인",
            concepts: ["큰 수의 법칙", "상대도수", "확률"]
          },
          {
            id: "significance", title: "유의수준과 동전 100번",
            file: "programs/4차시 유의수준과 동전 100번.html",
            type: "시뮬레이터", session: "4차시", pages: "70~71쪽",
            summary: "n번 중 k번이 나올 확률을 예상하고 확인. 유의수준 5%와 1%의 판정선",
            concepts: ["확률", "경우의 수", "유의수준", "유의확률"]
          }
        ]
      },
      {
        no: 4, title: "쓸데없는 숫자로 벌어지는 헛소동", page: 89,
        sections: ["IQ는 믿을 만한가", "예상오차", "아무리 적어도 차이는 차이"],
        programs: [
          {
            id: "probable-error", title: "예상오차와 표준오차",
            file: "programs/4차시 예상오차와 표준오차.html",
            type: "실험", session: "4차시", pages: "94~95쪽",
            summary: "발걸음으로 100m를 10번 재서 예상오차 구하기. 피터 98 vs 린다 101",
            concepts: ["오차", "예상오차", "표준오차", "중앙값"]
          }
        ]
      },
      { no: 5, title: "사람 눈을 속이는 그래프", page: 101,
        sections: ["눈을 속이는 그래프", "작은 것도 크게", "절단된 막대그래프"],
        programs: [
          {
            id: "graph-axis-lab", title: "그래프 축 실험실",
            file: "programs/5차시 그래프 축 실험실.html",
            type: "실험", session: "5차시", pages: "104~105쪽",
            summary: "같은 10% 증가를 세로축만 바꿔 그려 보고, 보이는 배수를 손으로 계산해 과장 정도를 확인",
            concepts: ["그래프", "세로축", "축 자르기", "과장 배율"]
          }
        ] },
      { no: 6, title: "백문이 불여일견이라고? 천만에", page: 113,
        sections: ["막대그래프도 모자라나", "시각을 자극하는 그림 도표", "과장된 도표들"],
        programs: [
          {
            id: "money-bag-trap", title: "돈자루 그림의 함정",
            file: "programs/5차시 돈자루 그림의 함정.html",
            type: "실험", session: "5차시", pages: "120~121쪽",
            summary: "2배 차이를 돈자루로 그리면 넓이 4배, 부피 8배로 보인다. 네 가지 그림 방식 비교와 닮음비 계산",
            concepts: ["그림 도표", "닮음비", "넓이 비", "부피 비", "과장"]
          }
        ] },
      { no: 7, title: "아전인수를 위한 마구잡이 통계", page: 127,
        sections: ["억지로 갖다 붙이기", "숫자로 장난치기", "숫자는 실제와 다르다", "의미 없는 숫자", "4년마다 생기는 숫자들"], programs: [] },
      // 8~10장은 아직 목차 사진에 없어 원서 기준 임시 제목
      { no: 8, title: "원인과 결과의 혼동", programs: [] },
      { no: 9, title: "통계를 조작하는 법", programs: [] },
      { no: 10, title: "통계에 되묻는 법", programs: [] }
    ]
  }
];
