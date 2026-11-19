// DOM 引用与 Canvas 上下文；脚本为 module，会在 HTML 解析完成后运行。
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
