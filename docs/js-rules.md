# JavaScript 규칙

이 문서는 `assets/js/main.js`에 적용되는 모든 JS 규칙을 정의합니다.

---

## 1. DOM 선택

```js
// ID → getElementById
const container = document.getElementById('github-items');

// 클래스/복합 → querySelector/All, 부모 스코프 우선
const btns = nav.querySelectorAll('.category-nav__btn');
backdrop.querySelector('.modal-close');  // 스코프 선택
```

- 2번 이상 참조하는 요소는 함수 상단에 `const`로 변수화
- 기본 `const`, 재할당 시에만 `let`

---

## 2. 가드 클래스 (Early Return)

```js
function initSomething() {
  const el = document.getElementById('target');
  if (!el) return;  // ← 필수 DOM이 없으면 즉시 종료
  // ... 이후 로직
}
```

---

## 3. 이벤트 처리

```js
// addEventListener만 사용
btn.addEventListener('click', () => { ... });
document.querySelectorAll('.js-trigger').forEach(el => el.addEventListener('click', handler));

// 금지: onclick 속성, element.onclick = ...
```

---

## 4. 함수 선언

| 종류 | 방식 | 예시 |
|---|---|---|
| 유틸/헬퍼/init | `function` 선언식 | `function esc(str) {}`, `function initModal() {}` |
| 이벤트 콜백/클로저 | 화살표 함수 | `const open = () => {}`, `btn.addEventListener('click', () => {})` |

---

## 5. 비동기 처리

**`async/await` + `fetchWithTimeout()` + `try/catch/finally`** 패턴 고정.

```js
async function fetchSomething() {
  const container = document.getElementById('target');
  if (!container) return;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Service ' + res.status);
    const data = await res.json();

    container.innerHTML = data.map(item => {
      const title = esc(item.title);
      const href = safeUrl(item.url);
      return `<a class="featured-item" href="${href}" target="_blank" rel="noopener">
        <div class="featured-item__label">${title}</div>
      </a>`;
    }).join('');
  } catch (e) {
    console.warn('Fetch failed:', e);
    showFetchError(container, e.name === 'AbortError' ? '응답 시간 초과' : '불러오기 실패 — 새로고침 해보세요');
  } finally { }
}
```

---

## 6. 보안

| 함수 | 용도 | 필수 사용 시점 |
|---|---|---|
| `esc(str)` | HTML 특수문자 이스케이프 | 외부 데이터 → innerHTML 삽입 시 |
| `safeUrl(url)` | http/https만 허용 | 외부 URL → href 삽입 시 |

---

## 7. 주석

```js
// -------------------------------------------------------
// 섹션 이름 (구분선)
// -------------------------------------------------------

/**
 * JSDoc 형식 (함수 위)
 * @param {string} str - 설명
 * @returns {string} 설명
 */

// 인라인 주석은 한글로 작성
```

---

## 8. 초기화 패턴

```js
document.addEventListener('DOMContentLoaded', () => {
  fetchGitHub();
  fetchVelog();
  initModal();
  initCategoryFilter();
  // ← 새 기능은 여기에 추가
});
```

---

## 9. 코드 배치 순서

```
1. 유틸리티 함수 (esc, safeUrl, fetchWithTimeout, showFetchError)
2. Auto-fetch 함수 (fetchGitHub, fetchVelog, ...)
3. DOMContentLoaded 초기화 블록
4. 기능별 init 함수 (initCategoryFilter, initModal, ...)
```

---

## 10. CSS 클래스 조작

```js
element.classList.add('is-open');
element.classList.remove('is-hidden');
// 시각적 변경은 CSS 클래스로 처리. element.style은 overflow 제어 등 최소한만.
```

---

## 11. 접근성

- 모달: 포커스 트랩 (Tab/Shift+Tab 순환) + Escape 닫기 + 포커스 복귀
- 포커스 선택자: `'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])'`

---

## 12. 금지 사항

- 프레임워크/라이브러리 (React, Vue, jQuery 등) 사용 금지
- `eval()`, `document.write()` 사용 금지
- `innerHTML`에 `esc()` 없이 외부 데이터 직접 삽입 금지
- HTML 속성 이벤트 핸들러 (`onclick` 등) 금지
- `console.error` 대신 `console.warn` 사용
