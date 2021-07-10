import * as vscode from "vscode";

export function sequentialNumberGenerate() {
  if (vscode.window.activeTextEditor) {
    const input = vscode.window.showInputBox({
      value: "1",
      placeHolder: "1 + 1",
      prompt: "<start> <operator?> <step?>",
    });

    input.then((value) => {
      if (value) {
        const options: string[] = [];

        value.split(" ").forEach((element) => {
          if (element) {
            options.push(element);
          }
        });

        const start = options[0] ? options[0] : "1";
        let operator = "+";
        let step = "1";

        if (options[1]) {
          if (options[1] === "+" || options[1] === "-") {
            operator = options[1];
            step = options[2] ? options[2] : "1";
          } else {
            step = options[1];
          }
        }
        if (vscode.window.activeTextEditor !== undefined) {
          vscode.window.activeTextEditor.edit((editBuilder) => {
            if (vscode.window.activeTextEditor !== undefined) {
              vscode.window.activeTextEditor.selections.forEach((element, index) => {
                editBuilder.replace(element, eval(parseInt(start) + operator + index * parseInt(step)).toString());
              });
            }
          });
        }
      }
    });
  }
}
