# 工作流程規則

## 修改前預覽（僅限 Edit Automatically 模式）

**僅在使用者的權限模式為「Edit Automatically（自動編輯）」時，才需要在修改前以 diff 格式列出所有擬定的變更，並等待使用者明確確認後才可執行。**

若使用者使用的是「Plan Mode」或「Ask Before Edit」模式，則不需要預先回傳 diff，直接依照該模式的正常流程操作即可。

格式範例（僅 Edit Automatically 模式適用）：
```
📄 src/engine/GameEngine.js
- 舊的程式碼
+ 新的程式碼

📄 src/components/CombatScreen.jsx
- 舊的程式碼
+ 新的程式碼
```

等待使用者回覆「確認」、「ok」、「套用」或類似確認語後，才執行實際的檔案修改。

若使用者要求調整，先更新預覽，再等待確認。
