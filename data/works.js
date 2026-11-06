/* ============================================================
   작품 목록 — 이 파일만 고치면 사이트에 카드가 생깁니다.
   GitHub 웹에서: 이 파일 열기 → 연필(✎) 버튼 → 고치기 → Commit changes

   ▸ HTML 자료 올리기
     1) works/ 폴더에 HTML 파일(또는 폴더)을 끌어다 놓고 Commit
     2) 아래 목록에 항목을 하나 추가하고 url: "works/파일이름.html"
   ▸ 링크만 걸기
     url: "https://..." 처럼 주소를 그대로 적기
     (사이트 안 뷰어로 안 열리는 곳이면 embed: false)

   항목 형식 (필수: id, title, kind, url, summary)
   {
     id: "my-work",            // 영문·숫자·하이픈. 공유 주소(#my-work)에 쓰임
     title: "작품 이름",
     group: "수학 수업",       // 수학 수업 / 학급 운영 / 동아리 / 개인  (사이트 위쪽 분류 탭)
     kind: "게임",             // 게임 / 교재 / 앱 / 웹사이트 / 자료 …  (필터 버튼이 자동으로 생김)
     subject: "확률과 통계",
     audience: "고2~3",
     summary: "카드에 보이는 한 줄 소개",
     desc: "자세히 보기 창의 설명 (여러 줄 가능)",
     uses: ["수업 활용 아이디어 1", "아이디어 2"],
     tags: ["태그1", "태그2"],
     url: "works/my-work/",
     embed: true,              // false면 [바로 보기] 대신 새 탭으로 열기
     cover: "thumbs/my.jpg",   // 그림이 없으면 비워 두고 아래 글자 표지 사용
     glyph: "∑",               // 글자 표지에 크게 들어갈 기호
     color: "#3b5bdb",         // 글자 표지 색
     versions: 3,              // 개발 차수
     updated: "2026-11-03",
     blog: "",                 // 블로그 활용 글 주소 (있으면 버튼이 생김)
     files: [{ name: "학습지", url: "works/my-work/학습지.pdf" }],
     featured: true            // 맨 위 큰 카드로
   }
   ============================================================ */

/* 사이트 이름·소개 — 여기 글자만 바꾸면 화면 전체에 반영됩니다.
   title    : 첫 화면 큰 제목 + 왼쪽 위 이름. 띄어쓰기마다 줄이 바뀌고 마지막 줄은 외곽선 글자
              (예: "MATH LAB", "YOON MATH LAB", "수학 실험실" — 영어 짧은 단어가 가장 멋있어요)
   subtitle : 큰 제목 아래 한글 제목 ('실험실' 글자는 형광색으로 강조)
   intro    : 소개 문장
   owner, role : 맨 위 작은 글씨 (예: 고등학교 수학 교사 · 윤세웅) */
window.SITE = {
  owner: "윤세웅",
  role: "고등학교 수학 교사",
  title: "MATH LAB",
  subtitle: "윤세웅 수학 실험실",
  intro: "수업에 필요한 걸 찾다가 없으면 직접 만들었습니다. 방탈출, 3D 교과서, 경제 RPG처럼 Claude와 함께 실험하며 만든 수업 자료를 설치도 로그인도 없이 바로 실행해 볼 수 있어요.",
  blog: "",        // 블로그 첫 화면 주소 (예: https://blog.naver.com/아이디)
  email: ""        // 연락받을 메일 (비워 두면 숨김)
};

window.WORKS = [
  {
    id: "zvirus-escape",
    group: "수학 수업",
    title: "좀비바이러스 연구실",
    kind: "게임",
    subject: "확률과 통계",
    audience: "고2~3",
    summary: "수학 자물쇠를 풀고 해독제를 완성하는 확률과 통계 웹 방탈출. 7구역 28문항.",
    desc: "2094년, Z-Virus로 봉쇄된 연구동 지하에서 탈출하는 방탈출 게임입니다. 경우의 수, 확률, 통계 단원을 7구역 28문항으로 나누었고, 구역마다 열쇠·키패드·배전반·시료병·절단기·그래프 레버·해독제 합성처럼 다른 장치로 문이 열립니다.\n교사 설정에서 차시를 2·3차시로 나누고, 문항을 켜고 끄거나 값을 바꾸고, 힌트 대기 시간과 페널티를 정할 수 있습니다. 순위표와 CSV 기록을 지원합니다.",
    uses: [
      "단원 마무리 2~3차시: 구역별로 끊어서 진행",
      "모둠 대결: 순위표로 기록 비교",
      "개별 복습: 학생 휴대폰에서 [내 기록 CSV]로 제출"
    ],
    tags: ["방탈출", "2022 개정", "경우의 수", "조건부확률", "정규분포"],
    url: "",                  // 따로 배포된 주소를 넣거나, 편집실에서 링크로 넣기 (비어 있으면 사이트에서 숨김)
    embed: true,
    cover: "thumbs/zvirus.jpg",
    glyph: "Z",
    color: "#2f9e44",
    versions: 14,
    updated: "2026-11-03",
    blog: "",
    featured: true
  },
  {
    id: "prob-3d-textbook",
    group: "수학 수업",
    title: "확률과 통계 3D 교과서",
    kind: "교재",
    subject: "확률과 통계",
    audience: "고2~3",
    summary: "책상 위에 펼쳐진 3D 책에서 핵심 개념 15개를 예측 → 실험 → 증명 순서로 배웁니다.",
    desc: "레슨을 고르면 표지가 열리고, 넘길 때마다 책장이 말리듯 넘어갑니다. 내 답을 먼저 고르면 오른쪽 쪽에서 잉크 펜화 모형이 일어서고, 슬라이더로 조건을 바꾸며 관찰합니다.\n종이 덮개를 들추면 정답과 틀린 보기의 이유가 나오고, 도전 문제를 맞히면 도장이 찍힙니다. 교사용 노트와 글 화면(Text version)도 들어 있습니다.",
    uses: [
      "개념 도입: '먼저 예측하기' 단계를 전체 화면으로 띄워 함께 투표",
      "개별 탐구: 슬라이더 실험 후 관찰 내용을 학습지에 기록",
      "휴대폰에서는 두 손가락으로 확대해 책장 보기"
    ],
    tags: ["3D", "원순열", "이항정리", "정규분포", "신뢰구간"],
    url: "works/prob-3d-textbook/",
    embed: true,
    cover: "",
    glyph: "ₙCᵣ",
    color: "#1c3d5a",
    versions: 6,
    updated: "2026-10",
    blog: "",
    featured: true
  },
  {
    id: "acorn-forest",
    group: "수학 수업",
    title: "다람이의 도토리 숲",
    kind: "게임",
    subject: "경제 수학",
    audience: "고등",
    summary: "월급부터 재무계획서까지, 돈의 흐름을 따라 걷는 교육용 도트 RPG.",
    desc: "월급 → 예산 → 적금 → 복리 → 주식 첫걸음 → 카드 → 돌발 상황 → 장기 전망 → 재무계획서 순서로 진행합니다. 25~35분 정도 걸립니다.\n'-50% 뒤 +50%면 원래대로일까?' 같은 문제로 수익률의 곱셈 구조를 다루고, 바구니 실험으로 분산투자를 체험합니다. 지도 이동 없이 같은 미션을 하는 텍스트 학습 모드도 있습니다.",
    uses: [
      "경제 수학 1차시: 게임 후 재무계획서를 복사해 제출",
      "학생용 학습지와 함께 진행하고 교사용 정답으로 확인",
      "복리 단원 동기 유발"
    ],
    tags: ["도트 RPG", "복리", "예산", "분산투자"],
    url: "works/acorn-forest/",
    embed: true,
    cover: "",
    glyph: "(1+r)ⁿ",
    color: "#a0522d",
    versions: 6,
    updated: "2026-10",
    blog: "",
    files: [
      { name: "학습지 (학생용)", url: "works/acorn-forest/학습지_학생용.pdf" },
      { name: "학습지 (교사용 정답)", url: "works/acorn-forest/학습지_교사용정답.pdf" }
    ]
  },
  {
    id: "habit-quest",
    group: "학급 운영",
    title: "HABIT QUEST",
    kind: "앱",
    subject: "생활·공부 습관",
    audience: "학생",
    summary: "습관을 퀘스트로 바꾸는 RPG 앱. 공부 독서실, 섬 가꾸기, 친구 응원까지.",
    desc: "매일의 습관을 퀘스트로 완료하면 캐릭터가 성장하고 섬이 자라납니다. 친구들과 함께 쓰는 독서실(공부 타이머), 오늘의 공부 순위, 응원 반응, 섬 구역 꾸미기와 주민 이야기가 있습니다.\n구글 로그인으로 기기가 바뀌어도 기록이 이어지고, 홈 화면에 설치해 앱처럼 쓸 수 있습니다. 40차에 걸쳐 다듬고 있는 프로젝트입니다.",
    uses: [
      "학급 습관 챌린지: 시험 기간 공부 시간 기록",
      "자기주도학습 지도: 주간 퀘스트를 함께 정하기"
    ],
    tags: ["PWA", "구글 로그인", "공부 타이머", "게임화"],
    url: "https://sunny-marzipan-aa8627.netlify.app",
    embed: false,
    cover: "thumbs/habit.png",
    glyph: "HQ",
    color: "#7048e8",
    versions: 40,
    updated: "2026-10-22",
    blog: ""
  },
  {
    id: "book-concept-map",
    group: "수학 수업",
    title: "책 개념 지도 · 새빨간 거짓말, 통계",
    kind: "교재",
    subject: "통계",
    audience: "고등",
    summary: "책 표지를 가운데 두고, 장마다 연결된 수업 프로그램을 눌러 여는 독서 수업 지도.",
    desc: "『새빨간 거짓말, 통계』의 목차를 따라 표본추출의 맹점, 평균의 함정, 동전 던지기 실험실, 그래프의 속임수 같은 수업 프로그램을 장별로 연결했습니다.\n'개념으로 찾기'로 원하는 개념의 활동을 바로 찾을 수 있고, 새 책을 추가할 수 있게 만들었습니다.",
    uses: [
      "수학 독서 수업: 한 장 읽고 연결된 실험으로 확인",
      "통계 단원 보충: 그래프 축 실험실로 자료 해석 연습"
    ],
    tags: ["독서", "표본", "평균", "그래프", "실험"],
    url: "works/book-concept-map/",
    embed: true,
    cover: "thumbs/book.jpg",
    glyph: "?",
    color: "#c92a2a",
    versions: 2,
    updated: "2026-10-30",
    blog: ""
  },
  {
    id: "exam-analysis",
    group: "수학 수업",
    title: "기출 문제 시뮬레이션 · 수학Ⅰ",
    kind: "교재",
    subject: "수학Ⅰ",
    audience: "고2~3",
    summary: "2026 수능완성 문항을 g(t), h(t) 그래프를 움직여 보며 풀어 보는 분석 시뮬레이션.",
    desc: "위아래 그래프의 축을 통일하고, t를 움직이면 두 함수가 어떻게 함께 변하는지 탭으로 나눠 보여 줍니다. 풀이를 외우기보다 그래프로 문제의 구조를 보게 하려고 만들었습니다.",
    uses: [
      "문제 풀이 수업: 학생이 먼저 풀고 시뮬레이션으로 확인",
      "같은 방식으로 다른 기출 문항을 만들어 늘리기"
    ],
    tags: ["기출 분석", "함수 그래프", "시뮬레이션"],
    url: "works/exam-analysis/",
    embed: true,
    cover: "",
    glyph: "g(t)",
    color: "#0b7285",
    versions: 1,
    updated: "2026-10",
    blog: ""
  },
  {
    id: "closet",
    group: "동아리",
    title: "CLOSET 동아리 웹사이트",
    kind: "웹사이트",
    subject: "동아리",
    audience: "동아리·방문자",
    summary: "동아리 매거진 44쪽 뷰어와 탭 구성, 방명록을 담은 동아리 소개 사이트.",
    desc: "동아리 매거진을 넘겨 볼 수 있는 뷰어와 탭 구조, 구글 시트에 저장되는 방명록을 넣었습니다. 빌드 과정 없이 폴더만 올리면 배포됩니다.",
    uses: ["동아리 활동 결과물 공유", "학생들과 함께 운영하는 방명록"],
    tags: ["매거진 뷰어", "방명록", "Apps Script"],
    url: "",                  // 따로 배포된 주소를 넣거나, 편집실에서 링크로 넣기 (비어 있으면 사이트에서 숨김)
    embed: true,
    cover: "thumbs/closet.png",
    glyph: "C",
    color: "#495057",
    versions: 2,
    updated: "2026-11-02",
    blog: ""
  },
  {
    id: "star-shard",
    group: "개인",
    title: "별조각 이야기",
    kind: "게임",
    subject: "실험작",
    audience: "누구나",
    summary: "어둠의 기사와 고대 신전의 별조각을 둘러싼 짧은 텍스트 RPG. 방탈출의 출발점.",
    desc: "확률과 통계 방탈출의 1~5차 '별조각' 세계관이 처음 나온 실험작입니다. 이야기와 선택으로 진행하는 작은 RPG입니다.",
    uses: ["게임형 수업 자료를 만들기 전 프로토타입 예시로 소개"],
    tags: ["텍스트 RPG", "프로토타입"],
    url: "works/star-shard/",
    embed: true,
    cover: "",
    glyph: "✦",
    color: "#364fc7",
    versions: 1,
    updated: "2026-10",
    blog: ""
  }
];
