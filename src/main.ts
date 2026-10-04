import "./styles/index.css";
import { createApp } from "./app/app";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("FinalTags root element (#app) was not found.");
}

void createApp(app).start();
