import { createSlice } from "@reduxjs/toolkit";
import { setCodeId } from "./UserSlice";

const initialState = {
  html: "",
  css: "",
  javascript: "",
  code_id: "",
};

const codeSlice = createSlice({
  name: "code",
  initialState,
  // reducer is a function which defines how a state is updated this all is reducer, like setUsername is a reducer function which changes the value of username according to action.payload
  reducers: {
    setHtml: (state, action) => {
      state.html = action.payload;
    },
    setCss: (state, action) => {
      state.css = action.payload;
    },
    setJavascript: (state, action) => {
      state.javascript = action.payload;
    },
    setCodeId: (state, action) => {
      state.code_id = action.payload;
    },
    removeCodeId: (state, action) => {
      state.code_id = state.code_id.filter((id) => id !== action.payload);
    },

    // to store only the selected code when searched

    setSelectedCode: (state, action) => {
      const { html, css, javascript, code_id } = action.payload;
      state.html = html;
      state.css = css;
      state.javascript = javascript;
      state.code_id = code_id;
    },
  },
});

//action is like dispatch(setUsername(username)) which will trigger the reducer function to change the state and put value in username variable

export const { setHtml, setCss, setJavascript, setSelectedCode } =
  codeSlice.actions;
export default codeSlice.reducer;
