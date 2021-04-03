import * as TSU from "@panyam/tsutils";
import * as TSV from "@panyam/tsutils-ui";
import "./styles";
import { ScoresView } from "../widgets/ScoresView";

document.addEventListener("DOMContentLoaded", () => {
  const app = ((window as any).app = new App(document.querySelector("#center_div")!));
});

// The App is the coordinator!
class App extends TSV.View {
  allScoresView: ScoresView;
  myScoresView: ScoresView;
  popularScoresView: ScoresView;
  scoresTab: TSV.TabView;
  userId: string;

  get isLoggedIn(): boolean {
    return this.userId.length > 0;
  }

  loadChildViews(): void {
    super.loadChildViews();

    this.userId = ((this.find("#userId") as any)?.value || "").trim();
    this.scoresTab = new TSV.TabView(this.find("#scores_tab")!);
    this.scoresTab.on(TSV.TabClickedEvent, (evt: TSU.Events.TEvent) => {
      if (evt.payload == 0) {
        history.pushState(null, "All", "#All");
      } else if (evt.payload == 1) {
        history.pushState(null, "My Music", "#MyMusic");
        if (!this.isLoggedIn) {
          window.location.href = `/auth/login/?callbackURL=${window.location.href}`;
        }
      }
    });
    if (window.location.hash == "#MyMusic") {
      this.scoresTab.selectTab(1);
    } else if (window.location.hash == "#All") {
      this.scoresTab.selectTab(0);
    } else if (this.userId.length > 0) {
      this.scoresTab.selectTab(1);
    }
    // Create and bind the views
    // This should could be done with bindings
    this.allScoresView = new ScoresView(this.find("#all_scores_div")!);
    if (this.isLoggedIn) {
      this.myScoresView = new ScoresView(this.find("#my_scores_div")!);
    }
  }
}
