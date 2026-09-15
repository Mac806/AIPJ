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
- Provider별 병렬 요청, timeout, 사용자 취소, 부분 실패 처리
- 빈 질문·잘못된 JSON·미지원 Provider/모델 요청의 서버 차단
- 인증 실패·호출 제한·모델 오류·Provider 장애·timeout별 사용자 안내
- 세션 관리(생성/전환/이름변경/삭제/Pin)
- API 키를 제외한 세션·대화·사용량의 브라우저 저장 및 새로고침 복구
- 일반 모드 / 개발자 모드 분리
  - 일반 모드: 최신 모델셋 중심, 단순 UX
  - 개발자 모드: BYOK + generation 파라미터 제어

### 기술 상태
- Next.js 15 + React 19 + Tailwind CSS
- `app/api/chat/route.js` 기반 provider 라우팅 및 TEST/mock 분기
- 모델/가격/모드별 노출 정책 정리
- 최근 lint/build 기준 통과 상태 유지

> 현재 응답 표시 효과는 실제 토큰 스트리밍이 아닙니다. API 응답을 모두 받은 뒤 chunk로 나눠 보여주는 생성 애니메이션이며, 실제 스트리밍은 MVP 이후 범위입니다.

---

## 빠른 실행

요구 환경:

- Node.js 20 이상
- npm 10 이상

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

현재 MVP는 서버 환경변수에 API 키를 저장하지 않습니다. 개발자 모드의 BYOK 키는 실행 중 브라우저 메모리에만 유지되며, `.env*` 파일은 Git에서 제외됩니다. 향후 서버 설정이 필요해질 경우 비밀값이 없는 `.env.example`만 저장소에 추가합니다.

품질 검사는 아래 순서로 실행합니다.

```bash
npm run lint
npm test
npm run build
```

---

## 실행 모드

| 모드 | API 호출 | 용도 |
|---|---|---|
| 일반 모드 | 호출하지 않음 | `TEST` mock으로 비교·요약 UX 체험 |
| 개발자 모드 | 사용자 키로 호출 | BYOK 기반 Provider adapter 시험 |

일반 모드의 결과는 실제 AI 답변이 아닙니다. 개발자 모드의 키는 현재 탭 메모리에만 있고 새로고침하면 삭제되며, 대화 저장소·서버·로그에 보관하지 않는 것을 MVP 정책으로 합니다.

## Provider 지원 상태

| Provider | 일반 모드 | BYOK adapter | 현재 상태 |
|---|---|---|---|
| OpenAI | Mock | 있음 | 미검증 |
| Anthropic Claude | Mock | 있음 | 미검증 |
| Google Gemini | Mock | 있음 | 미검증 |
| Perplexity | Mock | 있음 | 미검증 |
| DeepSeek | Mock | 있음 | 미검증 |
| Mistral | Mock | 있음 | 미검증 |
| Qwen | Mock | 있음 | 미검증 |
| Groq | Mock | 있음 | 미검증 |
| Cohere | 미지원 | 없음 | 목록만 제공 |
| Suno, Udio, ElevenLabs, Whisper | 미지원 | 없음 | MVP 이후 |
| FLUX, Stable Diffusion, Roboflow | 미지원 | 없음 | MVP 이후 |
| Runway, Luma | 미지원 | 없음 | MVP 이후 |

`미검증`은 adapter 코드가 있지만 유료 실 API 전수 확인을 완료하지 않았다는 뜻입니다. 하드코딩된 모델명과 가격도 참고용이며, 비용은 확정 청구액이 아닌 예상치로 표시합니다.

## 현재 제한사항

- 실제 토큰 스트리밍 대신 완성된 응답을 chunk로 나눈 표시 애니메이션을 사용합니다.
- 대화는 브라우저 localStorage에 저장하고, 사용할 수 없는 환경에서는 IndexedDB로 대체합니다.
- 저장소 복구가 끝난 뒤 화면을 활성화하며, 저장 실패 시 새로고침 손실 가능성을 안내합니다.
- 문맥은 최근 4턴, 최대 8개 메시지·12,000자까지만 전달합니다.
- 반응형 레이아웃은 Windows Chromium 환경의 375×812, 768×1024, 1440×900 뷰포트에서 확인했습니다. iOS Safari, Android Chrome, macOS Safari, Firefox 실기기 검증은 별도로 필요합니다.
- 서버 DB, 계정, 결제, 구독 제한, 서버 키 저장은 구현하지 않았습니다.
- 비텍스트 Provider 실행과 LangChain/LangGraph 워크플로우는 MVP 이후 범위입니다.

---

## 주요 디렉토리

- `app/page.js` : 화면 오케스트레이션 컨테이너
- `app/api/chat/route.js` : 요청 라우팅, mock/실호출 분기, 비용 계산
- `components/*` : 채팅창/설정/세션/모달 UI
- `lib/mockAis.js` : provider/model/가격 및 mock 응답 유틸
- `lib/modelCapabilities.js` : 모델별 파라미터 호환 정책

---

## MVP 마감 상태

유료 API 전수 검증은 MVP 완료 조건에서 제외하고, mock/fixture와 사용자 BYOK를 기준으로 마감했습니다.

1. [완료] 로컬 빌드와 검사 기준선 복구
2. [완료] Provider adapter와 지원 상태 표준화
3. [완료] timeout·취소·부분 실패·비정상 응답 처리
4. [완료] API 키를 제외한 대화 세션 브라우저 영속화
5. [완료] 최근 4턴 기반 텍스트 문맥 전달
6. [완료] API 키 메모리 전용·오류 마스킹 등 보안선 확정
7. [완료] mock/BYOK/미검증 상태와 오류 UX 마감
8. [완료] 핵심 정책·파서·저장소 계약 테스트 추가
9. [완료] 최종 clean install → lint → test → build 검증
10. [완료] 서버 입력 경계·오류 코드·요약 정상 답변 조건·저장 실패 안내·모달/모바일 접근성 보강

Git 커밋과 `v0.1.0` 태그 생성은 사용자 승인 후 별도로 진행합니다.

상세 TODO와 변경 이력은 [`진행상황.md`](./진행상황.md)에서 지속 업데이트합니다.

---

## 참고

- 이 저장소는 빠른 실험과 UX 검증을 위한 MVP입니다.
- 민감 정보(`.env*`, API 키, 인증서)는 Git에 커밋하지 않도록 `.gitignore`를 사용합니다.
- `node_modules/`는 버전관리 대상이 아닙니다.

---

## License

내부 개발/검증용 (필요 시 라이선스 명시 예정)
