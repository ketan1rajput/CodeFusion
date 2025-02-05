const { Code } = require("../../models/Code");
const User = require("../../models/User");

async function saveCode(code) {
    const { title, htmlCode, cssCode, javaScriptCode, codeName } = code;

    // the code id must be equal to user id
    const userID = await User.findOne({
        attributes: ["id"],
        where: {
            isLoggedIn:true
        }
    })
    const filterUserId = userID.dataValues.id;

    const savedCode = await Code.upsert({
      code_id: filterUserId,
      code_title: title,
        code_name: codeName,
        html_code: htmlCode,
        css_code: cssCode,
        js_code: javaScriptCode
    })
}

async function showAllCode() {
    const userData = await User.findOne({
      where: {
        isLoggedIn: true,
      },
    });
  const userName = userData.dataValues.username;
  const codeId = userData.dataValues.id;
  const allCodeFiles = await Code.findOne({
    where: {
      code_id: codeId,
    },
  });

  let codeData = allCodeFiles.dataValues;
  codeData = { ...codeData, "username": userName  };
  return codeData;
}

async function fetchCode(id) {
  const codeData = await Code.findOne({
    where: {
      code_id: id,
    },
  });
  let html_code = codeData.dataValues.html_code;
  let css_code = codeData.dataValues.css_code;
  let js_code = codeData.dataValues.js_code;
  let code_id = codeData.dataValues.code_id;

  return {html_code, css_code, js_code, code_id};
}
module.exports = { saveCode, showAllCode, fetchCode }