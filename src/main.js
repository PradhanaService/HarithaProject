import "./styles.css";
import { startApp } from "./app.js";

try {
  startApp();
} catch (error) {
  console.error("ModelLink failed to start.", error);
}
