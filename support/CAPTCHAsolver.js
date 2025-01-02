/**
 * 驗證碼破解
 * 不能砍
 */

import fs from 'fs'
import path from 'path'

export async function solver(page) {
  const model_text = fs.readFileSync(path.join(__dirname, 'cbl-js', 'model.txt'), 'utf8')
  const code = fs.readFileSync(path.join(__dirname, 'cbl-js', 'CBL.min.js'), 'utf8')
  await page.addScriptTag({content: code})
  
  const answer = await page.evaluate(async ({model_text}) => {
    const cbl = window.CBL({
      /* 影像調整 */
      preprocess: function (img) {
        img.binarize(100);
        img.colorRegions(50);
      },
      /* 訓練參數 */
      model_string: model_text,
      character_set: "0123456789",
      exact_characters: 4,
      blob_min_pixels: 50,
      blob_max_pixels: 400,
      pattern_width: 25,
      pattern_height: 25,
      perceptive_colorspace: true,
      /* Define a method that fires immediately after successfully loading a saved model. */
      model_loaded: function () {
        // Don't enable the solve button until the model is loaded.
        // document.getElementById('solve').style.display = "block";
      }
    });
  
    /* 取得的驗證碼傳到外界去 */
    let answer = ''
    const readyGo = async function () {
      // Using the saved model, attempt to find a solution to a specific image.
      cbl.solve('#captcha').done(function (solution) {
        answer = solution
        // Upon finding a solution, fill the solution textbox with the answer.
      });
    }
    readyGo();
    return answer
  }, {model_text});

  await page.locator('#verificatoinCode').fill(answer)
}