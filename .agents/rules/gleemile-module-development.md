# Gleemile Module Development Guidelines

When creating a new module (Block) for the Gleemile dashboard, you must follow the "Info Modal First" UX pattern.
This ensures that users always read the purpose and usage of the module before activating it on their dashboard.

## Rule 1: Registration in `setup/page.tsx`
Whenever a new module is created, it MUST be registered in `src/app/mile/[teamId]/setup/page.tsx`.
1. Add the module to the appropriate category array (e.g., `AVAILABLE_MODULES.sports`).
2. The module MUST be added to the `MODULE_DETAILS` map.
3. The `MODULE_DETAILS` entry MUST include the following properties:
   - `title`: The title of the module in Korean.
   - `subtitle`: A short description or subtitle.
   - `target`: The target audience or teams that would benefit from this module.
   - `purpose`: A detailed explanation of what the module does.
   - `usage`: An array of strings explaining how to use the module step-by-step.

### Example `MODULE_DETAILS` entry:
```javascript
NewModuleBlock: {
  title: '새로운 모듈',
  subtitle: '새로운 기능의 요약',
  target: '이 기능을 필요로 하는 팀',
  purpose: '이 모듈의 주요 목적과 기능 설명',
  usage: [
    '첫 번째 사용 방법',
    '두 번째 사용 방법',
    '기타 팁'
  ]
}
```

## Rule 2: Default State
All new modules MUST default to being disabled (OFF). Do not push any default modules to the `enabledModules` array in Firebase during team creation or initialization. The user must manually turn on each module they want to use through the setup page.
