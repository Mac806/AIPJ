# AIPJ Mock Hub

Next.js + Tailwind CSS로 만든 다중 AI 통합 MVP 뼈대입니다. 실제 API 키와 결제 연동 없이도 한 화면에서 여러 AI를 선택하고, 메인 AI가 최종 요약을 만드는 흐름을 먼저 검증합니다.

## 포함 기능

- 여러 AI 선택
- 메인 AI 1개 지정
- 질문 1개 입력 후 AI별 mock 응답 표시
- 메인 AI mock 요약 출력
- 가짜 비용 계산
- 키 입력 시 실제 검증 없이 로드 상태만 표시

## 파일 구조

- [app/page.js](app/page.js) - 화면과 mock 스트리밍 로직
- [lib/mockAis.js](lib/mockAis.js) - AI 목록, mock 응답, 요약, 가짜 비용 계산
- [app/layout.js](app/layout.js) - 글로벌 폰트와 메타데이터
- [app/globals.css](app/globals.css) - 전역 스타일과 배경

## 실행 방법

1. 의존성 설치: `npm install`
2. 개발 서버 실행: `npm run dev`
3. 브라우저에서 `http://localhost:3000` 확인

## 실제 API로 바꾸는 지점

- `lib/mockAis.js`의 `buildMockAnswer`를 실제 provider SDK 호출로 교체
- `buildMockSummary`를 메인 AI 요약 API로 교체

- `app/page.js`의 키 로드 버튼을 저장/검증 플로우로 교체

## 다음 단계 제안

1. provider별 API 어댑터 분리
2. 대화 히스토리 저장소 추가
3. 스트리밍 응답을 SSE 또는 서버 액션으로 전환
4. WebView / Capacitor 래핑 준비


## 수정하고자 하는 사항
1. AI 선택창 별도로 분리. (UI 정리 필요)
2. 질문 엔터로 입력, Shift+Enter로 다음 줄 넘어가기
3. 개발자 모드에선 API 직접 입력 가능하게 만들기(대화 내용, 업로드 파일 저장 등 개발자 DB 사용하기에 특정 구독금액 이상만 사용 가능하게 바꾸기). 서버 모드의 경우 지정된 API로 자동 불러오기. (모델에 따른 가격 책정하여 구독형으로 만들기 -> 구독형에 따라 토큰 차등 제한 만들기)
4. 기본 System_instruction 구성 필요(단답으로 답 나오는 문제)
5. 메인 AI와는 별도로 요약 AI만 만들까 고민 -> 요약 AI의 경우 판단 밑 기타 검색은 제외하고 다른 AI의 답변들만 정리하는 목적.
