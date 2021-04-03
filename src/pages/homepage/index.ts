import * as TSU from "@panyam/tsutils";
import * as TSV from "@panyam/tsutils-ui";
import * as ltb from "ltb";
import "./styles";

document.addEventListener("DOMContentLoaded", () => {
  const app = ((window as any).app = new App(document.querySelector("#center_div")!));
});

// The App is the coordinator!
class App extends TSV.View {
  loadChildViews(): void {
    super.loadChildViews();
  }
}
