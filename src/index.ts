import { NgModule } from "@angular/core";
import { TerminalDecorator } from "tabby-terminal";
import { ErrorHighlightDecorator } from "./decorator";

@NgModule({
  providers: [
    { provide: TerminalDecorator, useClass: ErrorHighlightDecorator, multi: true },
  ],
})
export default class ErrorHighlightModule {}
