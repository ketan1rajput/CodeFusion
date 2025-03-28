const Code = require("../../models/Code");
const User = require("../../models/User");

async function saveCode(codeDetails, userId) {
  const {
    title,
    htmlCode,
    cssCode,
    javaScriptCode,
    codeName,
    username,
    userid,
  } = codeDetails;
  let filterUserId;
  console.log(userId);
  if (userId) {
    filterUserId = userId;
  } else {
    userId = await User.findOne({
      attributes: ["id"],
      where: {
        isLoggedIn: true,
        username: username,
        id: userid,
      },
    });
    filterUserId = userId.dataValues.id;
  }
  await Code.upsert({
    user_id: filterUserId,
    code_title: title,
    code_name: codeName,
    html_code: htmlCode,
    css_code: cssCode,
    js_code: javaScriptCode,
  });
}

async function saveNewCode(codeDetails) {
  let { htmlCode, cssCode, javaScriptCode, title, username, userId } =
    codeDetails;
  let filterUserId;
  console.log(userId);
  if (userId) {
    filterUserId = userId;
  } else {
    userId = await User.findOne({
      attributes: ["id"],
      where: {
        isLoggedIn: true,
        username: username,
        id: userId,
      },
    });
    filterUserId = userId.dataValues.id;
  }
  await Code.create({
    user_id: filterUserId,
    code_title: title,
    html_code: htmlCode,
    css_code: cssCode,
    js_code: javaScriptCode,
  });
}

async function showAllCode(username, userId) {
  const userData = await User.findOne({
    where: {
      username: username,
      id: userId,
    },
  });
  const userName = userData?.dataValues?.username;
  // const codeId = userData?.dataValues?.id;
  const allCodeFiles = await Code.findAll({
    where: {
      user_id: userData?.dataValues?.id,
    },
  });

  let codeData = allCodeFiles.map((code) => code.dataValues);
  codeData = { ...codeData, username: userName };
  return codeData;
}

async function deleteCode(id) {
  const deleteCode = await Code.findOne({
    where: {
      code_id: id,
    },
  });

  if (!deleteCode) {
    console.log(`code with ${id} not found`);
    return;
  } else {
    await deleteCode.destroy();
    console.log("code deleted successfully");
  }
  return true;
}

async function fetchCode(id) {
  const codeData = await Code.findOne({
    where: {
      code_id: id,
    },
  });
  let html_code = codeData?.dataValues?.html_code;
  let css_code = codeData?.dataValues?.css_code;
  let js_code = codeData?.dataValues?.js_code;
  let code_id = codeData?.dataValues?.code_id;

  return { html_code, css_code, js_code, code_id };
}

module.exports = { saveCode, showAllCode, fetchCode, saveNewCode, deleteCode };
