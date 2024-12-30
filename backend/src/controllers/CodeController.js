const { Code } = require("../../models/Code");
const User = require("../../models/User");

async function saveCode(code) {
    const { title, htmlCode, cssCode, javaScriptCode, codeName } = code;

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
  const allCodeFiles = await User.findOne({
    where: {
      isLoggedIn: true,
    },
  });

  const { html_code, css_code, js_code } = allCodeFiles;
  return { html_code, css_code, js_code };
}

module.exports = { saveCode, showAllCode }