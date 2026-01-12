# 대화형 가계도 - Genogram Builder

React와 React Flow를 기반으로 한 대화형 가계도(Genogram) 작성 애플리케이션입니다.

![Genogram Builder](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Vite](https://img.shields.io/badge/Vite-6.0-purple)

## ✨ 주요 기능

### 가족 구성원 관리
- **추가/수정/삭제**: 가족 구성원을 손쉽게 관리
- **기본 정보 입력**: 이름, 나이, 성별, 사망 여부
- **가족 관계 설정**: 부모, 배우자, 형제/자매 관계 지정
- **관계 상태**: 결혼/이혼 상태 표시

### 가계도 시각화
- **드래그 앤 드롭**: 노드를 자유롭게 이동하여 배치
- **자동 정렬**: 가계도를 세대별로 자동 정렬
- **미니맵**: 전체 가계도를 한눈에 확인
- **줌/패닝**: 확대/축소 및 캔버스 이동

### 데이터 관리
- **프로젝트 저장/불러오기**: JSON 형식으로 가계도 저장 및 불러오기
- **PNG 이미지 저장**: 가계도를 이미지로 내보내기
- **초기화**: 가계도 데이터 전체 삭제

### 속성 마커
- 4분면 속성 마커로 구성원별 특성 표시 (A-L)

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **프레임워크** | React 18 |
| **언어** | TypeScript |
| **빌드 도구** | Vite |
| **다이어그램** | @xyflow/react (React Flow) |
| **상태 관리** | Zustand |
| **이미지 변환** | html-to-image |

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치
```bash
# 의존성 설치
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:5173](http://localhost:5173) 접속

### 프로덕션 빌드
```bash
npm run build
```

### 빌드 미리보기
```bash
npm run preview
```

## 📁 프로젝트 구조

```
Family-tree/
├── src/
│   ├── components/
│   │   ├── nodes/          # 커스텀 노드 컴포넌트
│   │   │   ├── MaleNode.tsx
│   │   │   ├── FemaleNode.tsx
│   │   │   └── MarriageNode.tsx
│   │   ├── edges/          # 커스텀 엣지 컴포넌트
│   │   │   └── MarriageEdge.tsx
│   │   ├── GenogramDiagram.tsx   # 메인 다이어그램 캔버스
│   │   ├── LeftPanel.tsx         # 좌측 입력 패널
│   │   ├── Legend.tsx            # 범례
│   │   ├── CustomMiniMap.tsx     # 미니맵
│   │   ├── NodeContextMenu.tsx   # 노드 컨텍스트 메뉴
│   │   └── PaneContextMenu.tsx   # 캔버스 컨텍스트 메뉴
│   ├── store/
│   │   └── useGenogramStore.ts   # Zustand 상태 관리
│   ├── types/
│   │   └── types.ts              # TypeScript 타입 정의
│   ├── utils/
│   │   └── attributeColors.ts    # 속성 색상 유틸리티
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎨 사용 방법

### 1. 가족 구성원 추가
1. 좌측 패널에서 이름, 나이, 성별 입력
2. 필요시 사망 여부 체크
3. **➕ 추가** 버튼 클릭

### 2. 가족 관계 설정
1. 목록에서 구성원 선택
2. 아버지/어머니/배우자 선택
3. 관계 상태(결혼/이혼) 선택
4. **✏️ 수정** 버튼 클릭

### 3. 가계도 정렬
- 상단의 **📐 정렬** 버튼으로 자동 배치
- 노드를 드래그하여 수동 배치

### 4. 저장 및 내보내기
- **💾 저장**: PNG 이미지로 저장
- **📄 프로젝트 저장**: JSON 파일로 저장
- **📂 불러오기**: JSON 파일 불러오기

## 📝 기호 설명

| 기호 | 의미 |
|------|------|
| □ | 남성 |
| ○ | 여성 |
| ━ | 결혼 |
| ╱╱ | 이혼 |
| ╳ | 사망 |

## 📄 라이선스

MIT License

## 🙏 기여

버그 리포트, 기능 제안, Pull Request를 환영합니다!
