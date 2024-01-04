"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main.ts
var core9 = __toESM(require("@actions/core"));
var github12 = __toESM(require("@actions/github"));

// src/utils/createIssueComment.ts
var core2 = __toESM(require("@actions/core"));
var github2 = __toESM(require("@actions/github"));

// src/utils/createDiscussionComment.ts
var core = __toESM(require("@actions/core"));
var github = __toESM(require("@actions/github"));
async function createDiscussionComment({
  discussion_number: discussionId,
  body,
  octokit
}) {
  const mutation = `mutation($discussionId: ID!, $body: String) {
    addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
      comment {
        body
      }
    }
  }`;
  await octokit.graphql({
    query: mutation,
    discussionId,
    body
  });
  const url = github.context.payload?.discussion?.html_url;
  core.info(`complete to push translate discussion comment: ${body} in ${url} `);
}

// src/utils/createIssueComment.ts
async function createIssueComment({
  pull_number,
  discussion_number,
  issue_number,
  body,
  octokit
}) {
  const { owner, repo } = github2.context.repo;
  if (discussion_number) {
    return createDiscussionComment({
      discussion_number,
      body,
      octokit
    });
  }
  const number = issue_number || pull_number;
  if (!number) {
    return;
  }
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body
  });
  const url = github2.context.payload?.issue?.html_url;
  core2.info(`complete to push translate issue comment: ${body} in ${url} `);
}

// src/utils/isTargetLanguage.ts
var core3 = __toESM(require("@actions/core"));
var import_franc_min = __toESM(require("franc-min"));
function isTargetLanguage(body, language = "eng") {
  if (body === null) {
    return true;
  }
  const detectResult = (0, import_franc_min.default)(body);
  if (detectResult === "und" || detectResult === void 0 || detectResult === null) {
    core3.warning(`Can not detect the undetermined comment body: ${body}`);
    return false;
  }
  core3.info(`Detect comment body language result is: ${detectResult}`);
  return detectResult === language;
}

// src/utils/translate.ts
var core4 = __toESM(require("@actions/core"));
var import_google_translate_api = __toESM(require("@tomsun28/google-translate-api"));
var import_langs = __toESM(require("langs"));
async function translate(text, language = "eng") {
  try {
    const to = import_langs.default.where("3", language)?.["1"];
    const resp = await (0, import_google_translate_api.default)(text, { to });
    return resp.text !== text ? resp.text : "";
  } catch (err) {
    core4.error(err);
    core4.setFailed(err.message);
  }
}
var MAGIC_JOIN_STRING = "@@====";
var translateText = {
  parse(text) {
    if (!text) {
      return [void 0, void 0];
    }
    const translateBody = text.split(MAGIC_JOIN_STRING);
    return [translateBody?.[0]?.trim(), translateBody[1].trim()];
  },
  stringify(body, title, language = "eng") {
    let needCommitComment = body && body !== "null" && !isTargetLanguage(body, language);
    let needCommitTitle = title && title !== "null" && !isTargetLanguage(title, language);
    let translateOrigin = null;
    if (!needCommitComment) {
      core4.info("Detect the issue comment body is english already, ignore.");
    }
    if (!needCommitTitle) {
      core4.info("Detect the issue title body is english already, ignore.");
    }
    if (!needCommitTitle && !needCommitComment) {
      core4.info("Detect the issue do not need translated, return.");
      return translateOrigin;
    }
    return [body || "null", title].join(MAGIC_JOIN_STRING);
  }
};

// src/utils/updateIssue.ts
var core6 = __toESM(require("@actions/core"));
var github4 = __toESM(require("@actions/github"));

// src/utils/updateDiscussion.ts
var core5 = __toESM(require("@actions/core"));
var github3 = __toESM(require("@actions/github"));
async function updateDiscussion({
  discussion_number: discussionId,
  comment_id: commentId,
  body,
  title,
  octokit
}) {
  const mutation = commentId ? `mutation($commentId: ID!, $body: String!) {
    updateDiscussionComment(input: {commentId: $commentId, body: $body}) {
      comment {
        body
      }
    }
  }` : `mutation($discussionId: ID!, $body: String, $title: String, ) {
    updateDiscussion(input: {discussionId: $discussionId, title: $title, body: $body}) {
      discussion {
        title
        body
      }
    }
  }`;
  await octokit.graphql({
    query: mutation,
    discussionId,
    commentId,
    body,
    title
  });
  const url = github3.context.payload?.discussion?.html_url;
  if (title) {
    core5.info(
      `complete to modify translate discussion title: ${title} in ${url} `
    );
  }
  if (body) {
    core5.info(
      `complete to modify translate discussion body: ${body} in ${url} `
    );
  }
}

// src/utils/updateIssue.ts
async function updateIssue({
  discussion_number,
  issue_number,
  comment_id,
  title,
  body,
  octokit
}) {
  if (discussion_number) {
    return updateDiscussion({
      discussion_number,
      comment_id,
      title,
      body,
      octokit
    });
  }
  const { owner, repo } = github4.context.repo;
  if (issue_number) {
    if (comment_id && body) {
      await octokit.rest.issues.updateComment({ owner, repo, comment_id, body });
    } else if (title || body) {
      await octokit.rest.issues.update({ owner, repo, issue_number, title, body });
    }
  }
  const url = github4.context.payload.issue?.html_url;
  if (title) {
    core6.info(`complete to modify translate issue title: ${title} in ${url} `);
  }
  if (body) {
    core6.info(`complete to modify translate issue body: ${body} in ${url} `);
  }
}

// src/modes/index.ts
var github11 = __toESM(require("@actions/github"));

// src/modes/issues.ts
var github5 = __toESM(require("@actions/github"));
var issues_default = {
  get match() {
    const {
      context: {
        payload: { issue }
      }
    } = github5;
    return Boolean(issue?.number);
  },
  get title() {
    return github5.context.payload.issue?.title;
  },
  get body() {
    return github5.context.payload.issue?.body;
  },
  async update(octokit, body, title) {
    const {
      context: {
        payload: { issue }
      }
    } = github5;
    return updateIssue({
      issue_number: issue?.number,
      title: title && title !== "null" ? title : void 0,
      body: body && body !== "null" ? body : void 0,
      octokit
    });
  }
};

// src/modes/discussion.ts
var github6 = __toESM(require("@actions/github"));
var discussion_default = {
  get match() {
    const {
      context: {
        payload: { discussion }
      }
    } = github6;
    return Boolean(discussion?.number);
  },
  get title() {
    return github6.context.payload.discussion?.title;
  },
  get body() {
    return github6.context.payload.discussion?.body;
  },
  async update(octokit, body, title) {
    const {
      context: {
        payload: { discussion }
      }
    } = github6;
    return updateIssue({
      discussion_number: discussion.node_id,
      title: title && title !== "null" ? title : void 0,
      body: body && body !== "null" ? body : void 0,
      octokit
    });
  }
};

// src/modes/issue_comment.ts
var github7 = __toESM(require("@actions/github"));
var issue_comment_default = {
  get match() {
    const {
      context: {
        payload: { issue }
      }
    } = github7;
    return Boolean(issue?.number);
  },
  get title() {
    return void 0;
  },
  get body() {
    return github7.context.payload.comment?.body;
  },
  async update(octokit, body) {
    const {
      context: {
        payload: { issue, comment }
      }
    } = github7;
    return updateIssue({
      issue_number: issue?.number,
      comment_id: comment?.id,
      body: body && body !== "null" ? body : void 0,
      octokit
    });
  }
};

// src/modes/discussion_comment.ts
var github8 = __toESM(require("@actions/github"));
var discussion_comment_default = {
  get match() {
    const {
      context: {
        payload: { discussion }
      }
    } = github8;
    return Boolean(discussion?.number);
  },
  get title() {
    return void 0;
  },
  get body() {
    return github8.context.payload.comment?.body;
  },
  async update(octokit, body, title) {
    const {
      context: {
        payload: { discussion, comment }
      }
    } = github8;
    return updateIssue({
      discussion_number: discussion.node_id,
      comment_id: comment?.node_id,
      title: title && title !== "null" ? title : void 0,
      body: body && body !== "null" ? body : void 0,
      octokit
    });
  }
};

// src/modes/pull_request.ts
var core7 = __toESM(require("@actions/core"));
var github9 = __toESM(require("@actions/github"));
var pull_request_default = {
  get match() {
    const {
      context: {
        payload: { pull_request }
      }
    } = github9;
    return Boolean(pull_request?.number);
  },
  get title() {
    return github9.context.payload.pull_request?.title;
  },
  get body() {
    return github9.context.payload.pull_request?.body;
  },
  async update(octokit, body, title) {
    const {
      context: {
        repo: { owner, repo },
        payload: { pull_request }
      }
    } = github9;
    if (!pull_request?.number) {
      return;
    }
    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: pull_request?.number,
      title: title && title !== "null" ? title : void 0,
      body: body && body !== "null" ? body : void 0
    });
    const url = github9.context.payload.pull_request?.html_url;
    if (title) {
      core7.info(
        `complete to modify translate pull_request title: ${title} in ${url} `
      );
    }
    if (body) {
      core7.info(
        `complete to modify translate pull_request body: ${body} in ${url} `
      );
    }
  }
};

// src/modes/pull_request_review_comment.ts
var core8 = __toESM(require("@actions/core"));
var github10 = __toESM(require("@actions/github"));
var pull_request_review_comment_default = {
  get match() {
    const {
      context: {
        payload: { pull_request }
      }
    } = github10;
    return Boolean(pull_request?.number);
  },
  get title() {
    return void 0;
  },
  get body() {
    return github10.context.payload.comment?.body;
  },
  async update(octokit, body) {
    const {
      context: {
        repo: { owner, repo },
        payload: { pull_request, comment }
      }
    } = github10;
    if (!pull_request?.number || !comment || !comment?.id || !body || body === "null") {
      return;
    }
    await octokit.rest.pulls.updateReviewComment({
      owner,
      repo,
      comment_id: comment.id,
      body
    });
    const url = github10.context.payload.pull_request?.html_url;
    if (body) {
      core8.info(
        `complete to modify translate pull_request body: ${body} in ${url} `
      );
    }
  }
};

// src/modes/index.ts
var models = {
  issues: issues_default,
  issue_comment: issue_comment_default,
  discussion: discussion_default,
  discussion_comment: discussion_comment_default,
  pull_request: pull_request_default,
  pull_request_target: pull_request_default,
  pull_request_review_comment: pull_request_review_comment_default
};
function getModel() {
  return models[github11.context.eventName];
}

// src/main.ts
var TRANSLATE_TITLE_DIVING = ` || `;
var TRANSLATE_DIVIDING_LINE = `<!--This is a translation content dividing line, the content below is generated by machine, please do not modify the content below-->`;
var DEFAULT_BOT_MESSAGE = `Bot detected the issue body's language is not English, translate it automatically. \u{1F46F}\u{1F46D}\u{1F3FB}\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F46B}\u{1F9D1}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FB}\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}\u{1F46C}\u{1F3FF}`;
var DEFAULT_BOT_TOKEN = process.env.GITHUB_TOKEN;
async function main() {
  const isModifyTitle = core9.getInput("IS_MODIFY_TITLE");
  const shouldAppendContent = core9.getInput("APPEND_TRANSLATION");
  const botNote = core9.getInput("CUSTOM_BOT_NOTE")?.trim() || DEFAULT_BOT_MESSAGE;
  const targetLanguage = core9.getInput("TARGET_LANGUAGE") || "eng";
  const botToken = DEFAULT_BOT_TOKEN;
  if (!botToken) {
    return core9.info(`GITHUB_TOKEN is requried!`);
  }
  const model = getModel();
  if (!model) {
    return;
  }
  const { match, title, body, update } = model;
  if (!match) {
    return;
  }
  const octokit = github12.getOctokit(botToken);
  const originTitle = title?.split(TRANSLATE_TITLE_DIVING)?.[0];
  const originComment = body?.split(TRANSLATE_DIVIDING_LINE)?.[0];
  const translateOrigin = translateText.stringify(
    originComment,
    originTitle,
    targetLanguage
  );
  if (!translateOrigin) {
    return;
  }
  core9.info(`translate origin body is: ${translateOrigin}`);
  const translateTmp = await translate(translateOrigin, targetLanguage);
  if (!translateTmp || translateTmp === translateOrigin) {
    return core9.warning("The translateBody is null or same, ignore return.");
  }
  core9.info(`translate body is: ${translateTmp}`);
  let [translateComment, translateTitle] = translateText.parse(translateTmp);
  if (shouldAppendContent) {
    const title2 = translateTitle && originTitle !== translateTitle && [originTitle, translateTitle].join(TRANSLATE_TITLE_DIVING);
    const body2 = translateComment && originComment !== translateComment && `${originComment}
${TRANSLATE_DIVIDING_LINE}
---
${translateComment}
`;
    await update(octokit, body2 || void 0, title2 || void 0);
  } else {
    const needCommitComment = translateComment && translateComment !== originComment;
    const {
      context: {
        payload: { issue, discussion, pull_request }
      }
    } = github12;
    translateComment = `
> ${botNote}
----
${isModifyTitle === "false" && needCommitComment ? `**Title:** ${translateTitle}` : ""}

${translateComment}`;
    if (isModifyTitle === "true" && translateTitle && translateTitle !== originTitle) {
      await update(octokit, void 0, translateTitle);
    }
    if (translateComment && translateComment !== originComment) {
      await createIssueComment({
        pull_number: pull_request?.number,
        discussion_number: discussion?.node_id,
        issue_number: issue?.number,
        body: translateComment,
        octokit
      });
    }
  }
  core9.setOutput("complete time", (/* @__PURE__ */ new Date()).toTimeString());
}
async function run() {
  try {
    await main();
  } catch (err) {
    core9.setFailed(err.message);
  }
}
run();
//# sourceMappingURL=main.js.map