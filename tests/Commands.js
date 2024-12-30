const { expect } = require('@playwright/test')

/** 
 * PDF 自動按關閉或看完
 * @param {object} page
 * @returns {Promise<null>} 
 * */
async function pdfNextStepLoop(page) {
    const waitingTime = 300
    let needClick = true

    while(needClick) {
        // 等待指定時間
        await page.waitForTimeout(waitingTime)
        
        // 有關閉, 直接關閉結束
        let isExist = await page.locator('app-preview-dialog button.btn-secondary').isVisible()
        if (isExist) {
            page.locator('app-preview-dialog button.btn-secondary').click();
            needClick = false;
        } else {
            // 檢查是否存在滾輪
            isExist = await page.locator('app-preview-dialog > .modal-body').isVisible()
            if (isExist) {
                // Execute JavaScript to scroll to the bottom of the page
                const scrollY = await page.evaluate(() => document.querySelector('app-preview-dialog > .modal-body').scrollHeight); // get the page height
                await page.mouse.wheel(0, scrollY); // scroll to the bottom
                
                await page.waitForTimeout(waitingTime)

                // 有下一頁 or 同意
                isExist = await page.locator('app-preview-dialog button.btn.btn-primary').isVisible()
                if (isExist) {
                    await page.locator('app-preview-dialog button.btn.btn-primary').click();
                    needClick = true;
                } else {
                    // 同意
                    await page.locator('app-preview-dialog button.btn.btn-success').click();
                    needClick = false;
                }
            } else {
                needClick = false
            }
        }
    }
}


/**
 * 資料輸入 主要步驟判斷
 * @param {object} page
 * @param {number} mainStep 現在的主要步驟, number
 * @returns {Promise<boolean>} true-可以執行 false-不可以
 * 
 */
async function mainStepIsMyTurn(page, mainStep) {
    /*
     * 主要步驟
     * 1-資料輸入
     * 2-文件預覽
     * 3-電子簽名
     * 4-上傳文件
     * 5-確認投保
     */
    const container = await page.locator('div.swiper-wrapper > div')
    const counts = await container.count()

    let nowMainStep = 0
    for(let i=0; i<counts; i++) {
        const subDiv = await container.nth(i)
        const isExist = await checkIfExist(subDiv, '.step__item--last')
        if (isExist)
            nowMainStep = i
    }

    if (nowMainStep===mainStep)
        return true
    else
        return false
}

/**
 * 資料輸入 步驟判斷
 * @param {object} page
 * @param {string} stepName 現在的步驟,中文
 * @returns {Promise<boolean>} true-可以執行 false-不可以
 */
async function subStepIsMyTurn(page, stepName) {
    // 找出目前主要步驟
    const pageSideBtns = await page.locator('div.page__sidebar-btn')
    const counts = await pageSideBtns.count()

    for(let i=0; i<counts; i++) {
        const btn = await pageSideBtns.nth(i)
        const locator = await btn.locator('span.page__sidebar-text')
        const spanText = await locator.textContent()
        // 找到了
        if (spanText.indexOf(stepName)>-1) {
            // 檢查 icon 是否 display: visible
            const spanIcon = await btn.locator(`span.page__sidebar-icon`)
            if (await spanIcon.isVisible())
                return false
            else
                return true
        }
    }

    return true
}

/** 
 * 檢核儲存
 * @param {object} page
 * @returns {Promise<null>} 
 *  */
async function clickSave(page) {
    await page.locator('.page__content__btn > button.btn-danger').click()
    // 如果有任何警告視窗,那就按
    const isExist = await page.locator('app-warning-dialog button.btn-primary').isVisible()
    if (isExist) {
        await page.locator('app-warning-dialog button.btn-primary').click()
    }
}

/**
 * 檢查物件是否存在
 * @param {object} parent 
 * @param {string} selector 選擇字串
 * @returns {boolean} true-存在
 */
async function checkIfExist(parent, selector) {
    const isExist = await parent.locator(selector).count()

    return isExist>0?true:false
}

module.exports = { 
    pdfNextStepLoop, 
    clickSave, 
    mainStepIsMyTurn, 
    subStepIsMyTurn,
    checkIfExist
}