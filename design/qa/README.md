# 굿즈샵 디자인 QA 자동화

- `run.js` — 캔버스 `project/` 폴더의 모든 `.dc.html`을 디자인 캔버스 런타임으로 렌더링해 `cases.json`의 케이스를 검사하고 `report.md`·`report.json`·`shots/*.png`를 만든다. P0·P1이 있으면 종료 코드 1.
- `cases.json` — 테스트 케이스(화면 공통 16종, 상태 화면 7종, 데이터 1종, 상태 화면 커버리지 22개). design-qa 에이전트가 새 화면·규칙에 맞춰 추가한다.
- `runtime/support.js` — 디자인 캔버스 런타임 사본(React 포함). 캔버스 타입이 바뀌면 캔버스 아티팩트의 `artifact-type/dc-runtime.js`를 다시 받아 바꾼다.

실행: `node run.js <project 폴더> --out <결과 폴더> [--only <파일 이름 일부>]`

에이전트: `~/.claude/agents/design-qa.md`, 명령: `/design-qa`.
