/* PDF 自動按關閉或自動看完 */
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

                // 有下一頁
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

/* 檢核儲存 */
async function clickSave(page) {
    await page.locator('.page__content__btn > button.btn-danger').click()
    // 如果有任何警告視窗,那就按
    const isExist = await page.locator('app-warning-dialog button.btn-primary').isVisible()
    if (isExist) {
      await page.locator('app-warning-dialog button.btn-primary').click()
    }
}

module.exports = { pdfNextStepLoop, clickSave }