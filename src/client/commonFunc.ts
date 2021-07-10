import * as vscode from "vscode";
import { client } from "./extension";

export const initSnippetCollector = async (reset: boolean = false) => {
  const files = await vscode.workspace.findFiles("**/*.pwn");
  for (const key in files) {
    if (files.hasOwnProperty(key)) {
      const element = files[key];
      (await vscode.workspace.openTextDocument(element)).getText();
    }
  }
  const filesInc = await vscode.workspace.findFiles("**/*.inc");
  for (const key in filesInc) {
    if (filesInc.hasOwnProperty(key)) {
      const element = filesInc[key];
      (await vscode.workspace.openTextDocument(element)).getText();
    }
  }

  if (client !== undefined && reset) client.sendNotification("revalidateAllOpenedDocuments");
};
