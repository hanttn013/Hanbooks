# QA Bug Log

| ID | Severity | Reproduction | Expected | Actual / root cause | Status |
| --- | --- | --- | --- | --- | --- |
| QA-001 | P1 | Run `npm run lint` on the Phase 0 starting revision. | No hook lint error. | Book Detail synchronously called a state setter from its metadata effect. | Fixed; unit regression added. |
| QA-002 | P2 | Run `npm run lint` on the Phase 0 starting revision. | No unused variables. | Two Library catch bindings named `e` were unused. | Fixed. |
| QA-003 | P1 | Open any screen and inspect the browser console. | Custom fonts decode without warnings. | Three Montserrat OTF files fail browser decoding/OTS validation. | Open; Phase 3. |
| QA-004 | P1 | Run the baseline axe scan on Home, Library, or Book Detail. | Interactive controls are not nested. | Card/button containers include other button-like descendants. | Open; Phase 3. |
| QA-005 | P1 | Run the baseline axe scan on Library and Book Detail. | Every select has an accessible name. | Sort and list selects are unlabeled (`select-name`, critical). | Open; Phase 3. |
| QA-006 | P1 | Run axe at 360x800 and inspect the viewport meta tag. | WCAG AA contrast and user zoom are available. | Five screens have contrast failures; every screen disables zoom. | Open; Phase 3. |
| QA-007 | P1 | Open Settings at any baseline viewport. | Header is fully visible. | Header/title are clipped above the framed content. | Open; Phase 3. |
| QA-008 | P2 | Open the app at 768x1024 or 1440x900. | Layout uses tablet/desktop space. | UI remains a centered narrow phone shell. | Open; Phase 3. |
| QA-009 | P2 | Open the demo EPUB and inspect console. | Safe content produces no console errors. | Sandboxed `about:srcdoc` blocks five script executions; security posture is correct but console is noisy. | Open; Phase 2. |
| QA-010 | P1 | Fast-import an EPUB that needs background metadata extraction. | Persisted status enters the worker queue and finishes/retries. | `addBook()` drops the pending state expected by the metadata processor. | Confirmed by code inspection; Phase 1 reproduction/fix pending. |
| QA-011 | P1 | Run `npm audit --omit=dev`. | No unresolved production advisories. | 11 vulnerabilities: 2 critical, 6 high, 3 moderate; some have no fix. | Open; dependency review required. |
| QA-012 | P2 | Run the full Playwright suite and watch the Vite server output. | No unhandled browser error reaches the dev server. | `ResizeObserver loop completed with undelivered notifications` appears once per viewport; all assertions still pass. | Open; isolate observer/layout source in Phase 1/3. |

Detailed screenshots, raw console entries, and raw axe violations are stored in
`qa/baseline/`.
