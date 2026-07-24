# AIPJ (AI Workspace MVP)

여러 AI를 **한 번에 비교**하고, 필요하면 **요약 AI로 정리**까지 하는 멀티 AI 오케스트레이션 프로젝트입니다.

> 비전 문서: [`PJvision.md`](./PJvision.md)  
> 운영/개발 현황: [`진행상황.md`](./진행상황.md)

---

## 프로젝트 비전

AIPJ는 단순한 단일 AI 채팅 앱이 아니라,

- 한 번의 질문으로 여러 AI 답변을 비교하고
- 차이/상충 포인트를 더 쉽게 파악하며
- 사용자(일반/개발자) 수준에 맞는 UX를 제공하는

**AI 작업 환경(AI Workspace)** 을 목표로 합니다.

---

## 현재 구현 상태 (MVP)

### 핵심 기능
- 다중 AI 선택 및 병렬 요청
- 비교 AI와 요약 AI 분리
  - 1개 선택: 요약 비활성화
  - 2개 선택: 요약 AI 자동 지정
  - 3개 이상: 요약 AI 직접 지정
- 요약 기능 ON/OFF 토글
- 요약 카드 + 원본 답변 모달(Provider 탭)
- 요약 OFF 전용 탐색 UI(Focus / Split / Grid)
- 세션 관리(생성/전환/이름변경/삭제/Pin)
- 일반 모드 / 개발자 모드 분리
  - 일반 모드: 최신 모델셋 중심, 단순 UX
  - 개발자 모드: BYOK + generation 파라미터 제어

### 기술 상태
- Next.js 15 + React 19 + Tailwind CSS
- `app/api/chat/route.js` 기반 provider 라우팅 및 TEST/mock 분기
- 모델/가격/모드별 노출 정책 정리
- 최근 lint/build 기준 통과 상태 유지

---

## 빠른 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 주요 디렉토리

- `app/page.js` : 화면 오케스트레이션 컨테이너
- `app/api/chat/route.js` : 요청 라우팅, mock/실호출 분기, 비용 계산
- `components/*` : 채팅창/설정/세션/모달 UI
- `lib/mockAis.js` : provider/model/가격 및 mock 응답 유틸
- `lib/modelCapabilities.js` : 모델별 파라미터 호환 정책

---

## 다음 우선순위

1. 키 관리 정책 고도화(세션 입력 vs 서버 암호화 저장)
2. DB 영속화(conversations / turns / usage 등)
3. 구독/토큰 제한 정책
4. 비텍스트 모델 결과 텍스트 정규화 파이프라인
5. LangGraph 등 오케스트레이션 고도화 PoC

상세 TODO와 변경 이력은 [`진행상황.md`](./진행상황.md)에서 지속 업데이트합니다.

---

## 참고

- 이 저장소는 빠른 실험과 UX 검증을 위한 MVP입니다.
- 민감 정보(`.env*`, API 키, 인증서)는 Git에 커밋하지 않도록 `.gitignore`를 사용합니다.
- `node_modules/`는 버전관리 대상이 아닙니다.

---

## License

내부 개발/검증용 (필요 시 라이선스 명시 예정)