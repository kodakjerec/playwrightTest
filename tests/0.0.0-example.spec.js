// @ts-check
const { test, expect } = require('@playwright/test')
const { 
    pdfNextStepLoop,
    clickTempSave,
    clickSave,
    clickDialog,
    mainStepIsMyTurn,
    subStepIsMyTurn,
    checkIfExist
} = require('./Commands')

import { solver } from '../support/CAPTCHAsolver'
import testData from '../fixtures/1.0.0-UAT2.json'

/** 本次測試時間 */
const now = new Date()
const month = now.getMonth() + 1
const date = now.getDate()
const hours = now.getHours()
const minutes = now.getMinutes()
const testTime = `日期${month}${date}${hours}${minutes}`

/** 本次測試參數 */
let newRecord = false // true-新增 false-修改

/** Seetings */
test.describe.configure({ mode: 'serial' })

let page // 共用page
test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
})
test.afterAll(async () => {
    await page.close()
})
const shortSleep = 500 // 短暫休息
const longSleep = 1500 // 長休息

/** ---------分隔線------------------------------------------------------------------------ */

/** RUN */
test.describe('測試連線', () => {
    test('登入', async () => {
        await page.goto(testData.loginUrl)

        await page.locator('#uname').fill(testData.userId)
        await page.locator('#pin').fill(testData.pin)
        await solver(page)
        await page.waitForTimeout(shortSleep)
        await Promise.all([
            page.waitForResponse(res => res.url().includes('login') && res.status() === 200)
            , page.waitForResponse(res => res.url().includes('categorycode') && res.status() === 200)
            , page.waitForResponse(res => res.url().includes('list') && res.status() === 200)
            , page.getByRole('button', { name: '登入' }).click()
        ])
        
    })

    test('新增/修改', async () => {
        if (newRecord) {
            // 新增
            await Promise.all([
                page.waitForResponse(res => res.url().includes('getPdfDocument') && res.status() === 200)
                , page.locator('.order-lg-1 > .card > .card-body > :nth-child(1) > :nth-child(1) > .me-2 > .row > a > .avatar-md > .avatar-title').click({ force: true })
            ])
            await page.waitForTimeout(shortSleep)
            // 同意書
            const isExist = await checkIfExist(page, 'app-preview-dialog button.btn-success')
            if (isExist) {
                pdfNextStepLoop(page)
            }
        }
        else {
            // 修改
            await Promise.all([
                page.waitForResponse(res => res.url().includes('verifyCase') && res.status() === 200)
                , page.locator(':nth-child(1) > :nth-child(6) > :nth-child(1) > .ri-edit-2-line').click()
            ])
            await Promise.all([
                page.waitForResponse(res => res.url().includes('query-one') && res.status() === 200)
                , clickDialog(page, true)
            ])
        }
    })

    test('被保險人', async () => {
        const pageName = '被保險人'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }

        await page.locator('input[formcontrolname="baseInfoName"]').fill(testData.insured.baseInfoName)
        await page.locator('input[formcontrolname="baseInfoGender"]').first().click()
        await page.locator('input[formcontrolname="baseInfoPersonId"]').fill(testData.insured.baseInfoPersonId)
        await page.locator('input[formcontrolname="baseInfoRomanName"]').fill(testData.insured.baseInfoName)

        // 日期(切換成成年日期)
        await page.locator('.mat-datepicker-input').fill(testData.insured.baseInfoBirthday)

        await page.locator('select[formcontrolname="baseInfoMarry"]').selectOption(testData.insured.baseInfoMarry)
        if (testData.insured.baseInfoNationality == "中華民國")
            await page.locator('input[formcontrolname="baseInfoNationalIsROC"]').check()
        else
            await page.locator('select[formcontrolname="baseInfoNationality"]').selectOption(testData.insured.baseInfoNationality)
        await page.locator('input[formcontrolname="serviceUnit"]').fill(testData.insured.serviceUnit)
        await page.locator('input[formcontrolname="workDetail"]').fill(testData.insured.workDetail)
        await page.locator('input[formcontrolname="partTimeDetail"]').fill(testData.insured.partTimeDetail)

        // 正職職業代碼 A101
        await Promise.all([
            await page.locator('input[formcontrolname="jobInfoCareerFull"]').click()
            , page.waitForResponse(res => res.url().includes('getSICInfo') && res.status() === 200)
        ])
        await page.waitForTimeout(shortSleep)
        await page.getByRole('dialog').locator('form div').filter({ hasText: /^職業查詢$/ }).click()
        await page.locator('input[name="jobCode"]').fill(testData.insured.jobCode)
        await page.getByRole('button', { name: '查詢' }).click()
        await page.waitForTimeout(shortSleep)
        await page.locator('tbody > :nth-child(1) > .align-items-center > .form-check-input').click()
        await page.locator('.modal-footer > .btn').click()

        // 間職職業代碼 A102
        await Promise.all([
            await page.locator('input[formcontrolname="parttimeJobOccupyFull"]').click()
            , page.waitForResponse(res => res.url().includes('getSICInfo') && res.status() === 200)
        ])
        await page.waitForTimeout(shortSleep)
        await page.getByRole('dialog').locator('form div').filter({ hasText: /^職業查詢$/ }).click()
        await page.locator('input[name="jobCode"]').fill(testData.insured.partTimeJobCode)
        await page.getByRole('button', { name: '查詢' }).click()
        await page.waitForTimeout(shortSleep)
        await page.locator('tbody > :nth-child(1) > .align-items-center > .form-check-input').click()
        await page.locator('.modal-footer > .btn').click()

        // 電話
        await page.locator('input[formcontrolname="phoneNumberLightArea"]').fill(testData.insured.phoneNumberLightArea)
        await page.locator('input[formcontrolname="phoneNumberLight"]').fill(testData.insured.phoneNumberLight)
        await page.locator('input[formcontrolname="phoneNumberLightExt"]').fill(testData.insured.phoneNumberLightExt)
        await page.locator('input[formcontrolname="phoneNumberNightArea"]').fill(testData.insured.phoneNumberNightArea)
        await page.locator('input[formcontrolname="phoneNumberNight"]').fill(testData.insured.phoneNumberNight)
        await page.locator('input[formcontrolname="phoneNumberNightExt"]').fill(testData.insured.phoneNumberNightExt)
        await page.locator('select[formcontrolname="cellphone"]').selectOption(testData.insured.cellphone)
        await page.locator('input[formcontrolname="cellphoneNumberNation"]').fill(testData.insured.cellphoneNumberNation)
        await page.locator('input[formcontrolname="cellphoneNumber"]').fill(testData.insured.cellphoneNumber)

        // 地址
        await page.locator('select[formcontrolname="addCity"]').selectOption(testData.insured.addCity)
        await page.locator('select[formcontrolname="addDistrict"]').selectOption(testData.insured.addDistrict)
        await page.locator('input[formcontrolname="addressBar"]').fill(testData.insured.addressBar)

        await page.locator('input[formcontrolname="emailLocal"]').fill(testData.insured.emailLocal)
        await page.locator('input[formcontrolname="emailDomain"]').fill(testData.insured.emailDomain)

        // 檢核儲存
        await clickSave(page)
    })

    test('要保人', async () => {
        const pageName = '要保人'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }

        // ***** 以下為要保人輸入 *****
        await page.locator('select[formcontrolname="relation"]').selectOption(testData.proposer.relation)
        await page.locator('input[formcontrolname="infoName"]').fill(testTime)
        await page.locator('input[formcontrolname="infoGender"]').last().click()
        await page.locator('input[formcontrolname="infoPersonId"]').fill(testData.proposer.infoPersonId)
        // await page.locator('input[formcontrolname="romanName"]').fill(testData.proposer.romanName)

        // 日期(切換成成年日期)
        await page.locator('.mat-datepicker-input').fill(testData.proposer.infoBirthday)

        // 國籍
        if (testData.proposer.infoNational == "中華民國")
            await page.locator('input[formcontrolname="infoNationalIsROC"]').check()
        else
            await page.locator('select[formcontrolname="infoNationalOtherDesc"]').selectOption(testData.proposer.infoNational)
        await page.locator('select[formcontrolname="infoMarry"]').selectOption(testData.proposer.infoMarry)
        await page.locator('input[formcontrolname="serviceUnit"]').fill(testData.proposer.serviceUnit)
        await page.locator('input[formcontrolname="workDetail"]').fill(testData.proposer.workDetail)
        await page.locator('input[formcontrolname="partTimeDetail"]').fill(testData.proposer.partTimeDetail)

        // 正職職業代碼 A101
        await page.locator('input[formcontrolname="jobOccupyFull"]').click()
        await page.locator('button.btn-info').first().click()
        await page.waitForTimeout(shortSleep)
        await page.locator('tbody > :nth-child(1) > .align-items-center > .form-check-input').click()
        await page.locator('.modal-footer > .btn').click()

        // 間職職業代碼 A102
        await page.locator('input[formcontrolname="parttimeJobOccupyFull"]').click()
        await page.locator('button.btn-info').first().click()
        await page.waitForTimeout(shortSleep)
        await page.locator('tbody > :nth-child(1) > .align-items-center > .form-check-input').click()
        await page.locator('.modal-footer > .btn').click()

        // 電話
        await page.locator('input[formcontrolname="phoneNumberLightArea"]').fill(testData.proposer.phoneNumberLightArea)
        await page.locator('input[formcontrolname="phoneNumberLight"]').fill(testData.proposer.phoneNumberLight)
        await page.locator('input[formcontrolname="phoneNumberLightExt"]').fill(testData.proposer.phoneNumberLightExt)
        await page.locator('input[formcontrolname="phoneNumberNightArea"]').fill(testData.proposer.phoneNumberNightArea)
        await page.locator('input[formcontrolname="phoneNumberNight"]').fill(testData.proposer.phoneNumberNight)
        await page.locator('input[formcontrolname="phoneNumberNightExt"]').fill(testData.proposer.phoneNumberNightExt)
        await page.locator('select[formcontrolname="phoneCellphone"]').selectOption(testData.proposer.phoneCellphone)
        await page.locator('input[formcontrolname="cellphoneNumberNation"]').fill(testData.proposer.cellphoneNumberNation)
        await page.locator('input[formcontrolname="phoneCellphoneNumber"]').fill(testData.proposer.phoneCellphoneNumber)

        // 地址
        await page.locator('select[formcontrolname="addrCity"]').selectOption(testData.proposer.addrCity)
        await page.locator('select[formcontrolname="addrDistrict"]').selectOption(testData.proposer.addrDistrict)
        await page.locator('input[formcontrolname="addrAddress"]').fill(testData.proposer.addrAddress)

        await page.locator('input[formcontrolname="emailLocal"]').fill(testData.proposer.emailLocal)
        await page.locator('input[formcontrolname="emailDomain"]').fill(testData.proposer.emailDomain)
        await page.locator('input[formcontrolname="policyType"]').first().check()

        // 風險同意書
        await page.locator('#pointer').click()
        await page.waitForTimeout(shortSleep)
        await page.locator('#customRadio01').click()
        await page.locator('.modal-footer > .btn-primary').click()

        // 檢核儲存
        await clickSave(page)
    })

    test('風險屬性', async () => {
        const pageName = '風險'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }

        await page.locator('#isInvestN').check()

        // 檢核儲存
        await clickSave(page)
    })

    test('保險種類', async () => {
        const pageName = '保險種類'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }

        // 等待系統讀取合約檔案
        await page.waitForTimeout(longSleep)

        // 新增主約
        await page.locator('button:has(span:text("增加主約"))').click()
        await page.waitForTimeout(shortSleep)
        // 選擇壽險主約
        await page.locator('div.mat-mdc-tab-labels > div').nth(0).click()
        // 找到指定險種
        await page.locator('tr:has(td:text("QHD"))').locator('button.btn-info').click()
        // 填入保額
        await page.locator('form div:has(label:text("保額"))').locator('input').fill('150')
        // 按下確認
        await page.locator('.modal-footer > .btn-primary').click()
        await page.waitForTimeout(shortSleep)

        // 檢核儲存
        await clickSave(page)
    })

    test('詢問事項', async () => {
        const pageName = '詢問事項'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }

        // 等待系統讀取合約檔案
        await page.waitForTimeout(longSleep)

        // 要保書填寫說明
        let isExist = await checkIfExist(page, 'app-preview-dialog button.btn-success')
        if (isExist) {
            pdfNextStepLoop(page)
        }

        // 身心障礙
        isExist = await checkIfExist(page, 'input[formcontrolname="question_1"]')
        if (isExist) {
            await page.locator(`input[formcontrolname="question_1"][value="${testData.noteAndInsuredRecord.question_1}"]`).click()
        }
        isExist = await checkIfExist(page, 'input[formcontrolname="question_2"]')
        if (isExist) {
            await page.locator(`input[formcontrolname="question_2"][value="${testData.noteAndInsuredRecord.question_1}"]`).click()
        }

        // 監護宣告
        isExist = await checkIfExist(page, 'input[formcontrolname="question_3"]')
        if (isExist) {
            await page.locator(`input[formcontrolname="question_3"][value="${testData.noteAndInsuredRecord.question_3}"]`).click()
        }
        isExist = await checkIfExist(page, 'input[formcontrolname="question_4"]')
        if (isExist) {
            await page.locator(`input[formcontrolname="question_4"][value="${testData.noteAndInsuredRecord.question_3}"]`).click()
        }
        isExist = await checkIfExist(page, 'input[formcontrolname="question_5"]')
        if (isExist) {
            await page.locator(`input[formcontrolname="question_5"][value="${testData.noteAndInsuredRecord.question_3}"]`).click()
        }

        // 檢核儲存
        await clickSave(page)
    })

    test('要保人帳戶', async () => {
        const pageName = '要保人帳戶'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        let isExist = await checkIfExist(page, '.row > :nth-child(2) > .btn')
        if (isExist) {
            await page.locator('.row > :nth-child(2) > .btn').click()
            await page.locator('.row > :nth-child(2) > .btn').click()
            await page.waitForTimeout(shortSleep)
        }

        await page.locator('select[formcontrolname="bankCode"]').selectOption(testData.bank.bankCode)
        await page.locator('select[formcontrolname="branchCode"]').selectOption(testData.bank.branchCode)
        await page.locator('input[formcontrolname="account"]').fill(testData.bank.account)

        // 檢核儲存
        await clickSave(page)
    })

    test('自動墊繳', async () => {
        const pageName = '自動墊繳'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        await page.locator('#autoPayment_left0').click()
        await page.locator('#payer_relations0_1').scrollIntoViewIfNeeded()
        await page.locator('#payer_relations0_1').click()

        // 檢核儲存
        await clickSave(page)
    })

    test('受益人', async () => {
        const pageName = '受益人'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        const counts = await page.locator('.mat-mdc-tab-labels > div').count()
        for(let i=0; i<counts; i++) {
            const $tab = await page.locator('.mat-mdc-tab-labels > div').nth(i)
            // 切換主約分頁
            await $tab.click()
            const tagName = await $tab.textContent()

            // 身故保險金受益人
            const tagDeadName = `#cradio1dead${tagName}`
            let isExist = await checkIfExist(page, tagDeadName)
            if (isExist) {
                // 順位
                await page.locator(tagDeadName).check()

                await page.locator('app-card:has(p:text("身故保險金受益人"))').locator('button.btn-primary').click()
                await page.waitForTimeout(shortSleep)
                await page.locator('#isLegalFalse').check()
                await page.locator('select[formcontrolname="distribution"]').selectOption(testData.beneficiary.distribution)
                await page.locator('input[formcontrolname="aveRatio"]').fill(testData.beneficiary.aveRatio)
                await page.locator('select[formcontrolname="relationshipValue"]').selectOption(testData.beneficiary.relationshipValue)
                await page.locator('input[formcontrolname="relationshipValueDesc"]').fill(testData.beneficiary.relationshipValueDesc)
                await page.locator('input[formcontrolname="name"]').fill(testData.beneficiary.name)
                await page.locator('input[formcontrolname="romanName"]').fill(testData.beneficiary.romanName)
                await page.locator('input[formcontrolname="idNo"]').fill(testData.beneficiary.idNo)
                if (testData.beneficiary.infoNational=="中華民國")
                    await page.locator('input[formcontrolname="infoNationalIsROC"]').check()
                else
                    await page.locator('select[formcontrolname="infoNationalOtherDesc"]').selectOption(testData.beneficiary.infoNational)
                await page.locator('.mat-datepicker-input').fill(testData.beneficiary.birthday)
                await page.locator('select[formcontrolname="addrCity"]').selectOption(testData.beneficiary.addrCity)
                await page.locator('select[formcontrolname="addrDistrict"]').selectOption(testData.beneficiary.addrDistrict)
                await page.locator('input[formcontrolname="addrDesc"]').fill(testData.beneficiary.addrDesc)
                await page.locator('input[formcontrolname="phoneArea"]').fill(testData.beneficiary.phoneArea)
                await page.locator('input[formcontrolname="phoneNumber"]').fill(testData.beneficiary.phoneNumber)
                await page.locator('input[formcontrolname="phoneExt"]').fill(testData.beneficiary.phoneExt)
                await page.locator('input[formcontrolname="cellPhoneNumber"]').fill(testData.beneficiary.cellPhoneNumber)
                await page.locator('input[formcontrolname="assignInsurance"]').fill(testData.beneficiary.assignInsurance)
                await page.locator('input[formcontrolname="forPay"]').first().check()
                await page.locator('input[formcontrolname="quotaInsurance"]').fill(testData.beneficiary.quotaInsurance)
                await page.locator('.btn-info').click()
                await page.locator('app-yes-no-dialog button.btn-secondary').click()
                await page.locator('app-warning-dialog button.btn-primary').click()
            }

            // 祝壽保險金受益人
            const tagBirthName = `#cradio1birth${tagName}`
            isExist = await checkIfExist(page, tagBirthName)
            if (isExist) {
                // 順位
                await page.locator(tagBirthName).check()

                await page.locator('app-card:has(p:text("滿期、祝壽保險金受益人"))').locator('button.btn-primary').click()
                await page.waitForTimeout(shortSleep)
                await page.locator('#isLegalFalse').check()
                await page.locator('select[formcontrolname="distribution"]').selectOption(testData.beneficiary.distribution)
                await page.locator('input[formcontrolname="aveRatio"]').fill(testData.beneficiary.aveRatio)
                await page.locator('select[formcontrolname="relationshipValue"]').selectOption(testData.beneficiary.relationshipValue)
                await page.locator('input[formcontrolname="relationshipValueDesc"]').fill(testData.beneficiary.relationshipValueDesc)
                await page.locator('input[formcontrolname="name"]').fill(testData.beneficiary.name)
                await page.locator('input[formcontrolname="romanName"]').fill(testData.beneficiary.romanName)
                await page.locator('input[formcontrolname="idNo"]').fill(testData.beneficiary.idNo)
                if (testData.beneficiary.infoNational=="中華民國")
                    await page.locator('input[formcontrolname="infoNationalIsROC"]').check()
                else
                    await page.locator('select[formcontrolname="infoNationalOtherDesc"]').selectOption(testData.beneficiary.infoNational)
                await page.locator('.mat-datepicker-input').fill(testData.beneficiary.birthday)
                await page.locator('select[formcontrolname="financialData"]').selectOption(testData.bank.bankCode)
                await page.locator('select[formcontrolname="branch"]').selectOption(testData.bank.branchCode)
                await page.locator('input[formcontrolname="accountNumber"]').fill(testData.bank.account)

                await page.locator('.btn-info').click()
                await page.locator('app-yes-no-dialog button.btn-secondary').click()
                await page.locator('app-warning-dialog button.btn-primary').click()
            }
        }

        // 檢核儲存
        await clickSave(page)
    })

    test('告知事項', async () => {
        const pageName = '告知事項'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        let isExist = await checkIfExist(page, 'input[formcontrolname="height"]')
        if (isExist) {
            await page.locator('input[formcontrolname="height"]').fill(testData.note.height)
            await page.locator('input[formcontrolname="weight"]').fill(testData.note.weight)
        }

        // 答題
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 8; j++) {
                let elementNameY = `input[id="${i.toString()}_${j.toString()}_Y"]`
                let elementNameN = `input[id="${i.toString()}_${j.toString()}_N"]`
                let isExistY = await checkIfExist(page, elementNameY)
                let isExistN = await checkIfExist(page, elementNameN)
                if (isExistY)
                    await page.locator(elementNameY).check()
                if (isExistN)
                    await page.locator(elementNameN).check()
            }
        }

        // 新增病例
        await page.locator('.col-md-2 > .btn').click()
        await page.locator('input[name="sickName"]').fill(testData.sickInfoList.sickName)
        await page.locator('input[name="hospital"]').fill(testData.sickInfoList.hospital)
        await page.locator('input[name="treatmentYear"]').fill(testData.sickInfoList.treatmentYear)
        await page.locator('input[name="treatmentMonth"]').fill(testData.sickInfoList.treatmentMonth)
        await page.locator('input[name="treatmentDay"]').fill(testData.sickInfoList.treatmentDay)
        await page.locator('input[name="treatmentWay"]').fill(testData.sickInfoList.treatmentWay)
        await page.locator('input[name="treatmentResults"]').fill(testData.sickInfoList.treatmentResults)
        await page.locator('.modal-footer > :nth-child(2)').click()

        // 檢核儲存
        await clickSave(page)
    })

    test('重要事項', async () => {
        const pageName = '重要事項'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        // 同意
        await page.locator('div.justify-content-md-end > button').first().click()

        // 檢核儲存
        await clickSave(page)
    })
    
    test('客戶投保權益 FATCA CRS', async () => {
        const pageName = '客戶投保權益'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        await page.locator('#rightOneY').check()
        await page.locator('#rightTwoY').check()
        await page.locator('#rightThreeY').check()
        await page.locator('#rightFourY').check()
        await page.locator('#rightFiveY').check()

        // 法定代理人
        let isExist = await checkIfExist(page, '#samePropser')
        if (isExist) {
            await page.locator('#samePropser').check()
            await page.locator('input[formcontrolname="name"]').fill(testData.proposer.infoName)
            await page.locator('input[formcontrolname="legalRepreRomanName"]').fill(testData.proposer.romanName)
            await page.locator('.mat-datepicker-input').fill(testData.proposer.infoBirthday)
            await page.locator('input[formcontrolname="legalRepresentativePersonId"]').fill(testData.proposer.infoPersonId)
        }

        // FATCA
        await page.locator('#fatcaOptionB').check()
        await page.locator('#fatcaBOption1').check()

        // CRS
        await page.locator('#crsOptionB').check()

        // 檢核儲存
        await clickSave(page)
    })
    
    test('W-8BEN', async () => {
        const pageName = 'W-8BEN'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        await page.locator('input[formcontrolname="name"]').fill(testData.insured.baseInfoRomanName)
        await page.locator('select[formcontrolname="nationality"]').selectOption(testData.insured.baseInfoNationality)
        await page.locator('input[formcontrolname="addr"]').fill(testData.insured.engAddress)
        await page.locator('input[formcontrolname="city"]').fill(testData.insured.engCity)
        await page.locator('select[formcontrolname="country"]').selectOption(testData.insured.baseInfoNationality)
        await page.locator('input[formcontrolname="diffAddr"]').fill(testData.insured.engAddress)
        await page.locator('input[formcontrolname="diffCity"]').fill(testData.insured.engCity)
        await page.locator('select[formcontrolname="diffCountry"]').selectOption(testData.insured.baseInfoNationality)
        // 美國納稅人稅籍號碼
        await page.locator('input[formcontrolname="taxNumbere"]').fill(testData.insured.taxNumbere)
        await page.locator('input[formcontrolname="foreignTaxNumber"]').fill(testData.insured.foreignTaxNumber)
        await page.locator('input[formcontrolname="referNumber"]').fill(testData.insured.referNumber)
        await page.locator('.mat-datepicker-input').fill(testData.proposer.infoBirthday)
        // 租稅協定優惠
        await page.locator('select[formcontrolname="beneficialCountry"]').selectOption(testData.insured.baseInfoNationality)
        await page.locator('input[formcontrolname="paragraph"]').fill(testData.insured.paragraph)
        await page.locator('input[formcontrolname="rate"]').fill(testData.insured.rate)
        await page.locator('input[formcontrolname="incomeType"]').fill(testData.insured.incomeType)
        await page.locator('input[formcontrolname="conditions"]').fill(testData.insured.conditions)

        // 檢核儲存
        await clickSave(page)
    })
    
    test('CRS自我證明', async () => {
        const pageName = 'CRS自我證明'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        // 自我證明表-個人 Self-Certification Form – Individua
        await page.locator('.d-flex > .btn').click()
        await page.locator('.modal-footer > .btn').click()

        // 個人帳戶
        await page.locator('input[formcontrolname="lastName"]').fill(testData.insured.lastName)
        await page.locator('input[formcontrolname="firstName"]').fill(testData.insured.firstName)
        await page.locator('input[formcontrolname="middleName"]').fill(testData.insured.middleName)
        await page.locator('.mat-datepicker-input').fill(testData.proposer.infoBirthday)
        // 現行地址
        await page.locator('input[formcontrolname="currentAddress"]').type(testData.insured.engAddress)
        await page.locator('input[formcontrolname="currentCity"]').fill(testData.insured.engCity)
        await page.locator('select[formcontrolname="currentCountry"]').selectOption(testData.insured.baseInfoNationality)
        await page.locator('input[formcontrolname="currentZip"]').fill(testData.insured.zip)
        // 通訊地址
        await page.locator('input[formcontrolname="address"]').type(testData.insured.engAddress)
        await page.locator('input[formcontrolname="city"]').fill(testData.insured.engCity)
        await page.locator('select[formcontrolname="country"]').selectOption(testData.insured.baseInfoNationality)
        await page.locator('input[formcontrolname="zip"]').fill(testData.insured.zip)
        // 出生地
        await page.locator('input[formcontrolname="birthCity"]').fill(testData.insured.engCity)
        await page.locator('select[formcontrolname="birthCountry"]').selectOption(testData.insured.baseInfoNationality)
        // 稅務識別碼
        await page.locator('.text-primary > .btn').click()
        await page.locator('select[formcontrolname="liveCountry"]').selectOption(testData.insured.baseInfoNationality)
        await page.locator('input[formcontrolname="tin"]').fill(testData.proposer.infoPersonId)
        await page.locator('.modal-footer > .btn-info').click()

        await page.locator('.text-primary > .btn').click()
        await page.locator('select[formcontrolname="liveCountry"]').selectOption(testData.insured.liveCountry)
        await page.locator('input[formcontrolname="tin"]').fill(testData.proposer.infoPersonId)
        await page.locator('.modal-footer > .btn-info').click()

        // 檢核儲存
        await clickSave(page)
    })
    
    test('審閱期聲明', async () => {
        const pageName = '審閱期聲明'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        const counts = await page.locator('.mat-mdc-tab-labels > div').count()
        for(let i=0; i<counts; i++) {
            const $tab = await page.locator('.mat-mdc-tab-labels > div').nth(i)
            // 切換主約分頁
            await $tab.click()
            
            await page.locator(':nth-child(1) > .form-check > .form-check-label').click()

            // 審閱期至少三日
            let today = new Date()
            today.setDate(today.getDate() - 4)
            let year = today.getFullYear()-1911
            let month = (today.getMonth()+1).toString().padStart(2,'0')
            let day = today.getDate().toString().padStart(2,'0')
            await page.locator('.mat-datepicker-input').fill(year+month+day)
        }

        // 檢核儲存
        await clickSave(page)
    })
    
    test('招攬人員', async () => {
        const pageName = '招攬人員'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        await page.locator('input[formcontrolname="commiAgentCode2"]').fill(testData.agent.agentCode2)
        await page.locator('label[for="assignRate2"]').click()
        await page.waitForTimeout(shortSleep)

        // 檢核儲存
        await clickSave(page)
    })
    
    test('財務狀況告知書', async () => {
        const pageName = '財務狀況告知書'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        let count = 0
        const counts = await page.locator('.mat-mdc-tab-labels > div').count()
        for(let i=0; i<counts; i++) {
            const $tab = await page.locator('.mat-mdc-tab-labels > div').nth(i)
            // 切換主約分頁
            await $tab.click()

            // 財務狀況
            await page.locator('input[formcontrolname="yearIncome"]').fill(testData.financial.yearIncome)
            await page.locator('input[formcontrolname="otherIncome"]').fill(testData.financial.otherIncome)
            await page.locator('input[formcontrolname="familyIncome"]').fill(testData.financial.familyIncome)
            await page.locator('input[formcontrolname="deposit"]').fill(testData.financial.deposit)
            await page.locator('input[formcontrolname="bankName"]').fill(testData.financial.bankName)
            await page.locator('input[formcontrolname="movableProperty"]').fill(testData.financial.movableProperty)
            // 不動產
            await page.locator('input[formcontrolname="estate"]').fill(testData.financial.estate)
            await page.locator('input[formcontrolname="local"]').fill(testData.insured.engAddress)
            await page.locator('input[formcontrolname="ping2"]').fill(testData.financial.ping)
            // 負債
            await page.locator('input[formcontrolname="borrowing"]').fill(testData.financial.borrowing)
            await page.locator('input[formcontrolname="borrowType"]').fill(testData.financial.borrowType)

            if (count === 1) {
                await page.locator('input[formcontrolname="insuranceFeeSources1"]').check({ force: true })
                await page.locator('input[formcontrolname="insuranceFeeSources3"]').check({ force: true })
                await page.locator('input[formcontrolname="insuranceFeeSources5"]').check({ force: true })
            }
            
            // 是否有辦理借款
            let isExist = await checkIfExist(page, 'input[formcontrolname="hasLoan"][value="N"]')
            if (isExist) {
                await page.locator('input[formcontrolname="hasLoan"][value="N"]').scrollIntoViewIfNeeded()
                await page.locator('input[formcontrolname="hasLoan"][value="N"]').check()
                await page.locator('input[formcontrolname="hasTermination"][value="N"]').scrollIntoViewIfNeeded()
                await page.locator('input[formcontrolname="hasTermination"][value="N"]').check()
            }

            count++
        }

        // 檢核儲存
        await clickTempSave(page)
    })
    
    test('業務員核保報告書', async () => {
        const pageName = '業務員核保報告書'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        await page.locator('input[formcontrolname="relationship"][value="4"]').check()
        await page.locator('input[formcontrolname="applicantPurposeChoice1"]').check()
        await page.locator('input[formcontrolname="selfApply"][value="0"]').check()
        await page.locator('input[formcontrolname="specialRemart"][value="0"]').check()
        // 被保險人財務狀況
        await page.locator('input[formcontrolname="insuredWorkIncome"]').fill(testData.financial.yearIncome)
        await page.locator('input[formcontrolname="insuredOtherIncome"]').fill(testData.financial.otherIncome)
        await page.locator('input[formcontrolname="insuredHouseholdIncome"]').fill(testData.financial.familyIncome)
        // 要保人財務狀況
        await page.locator('input[formcontrolname="proposerWorkIncome"]').fill(testData.financial.yearIncome)
        await page.locator('input[formcontrolname="proposerOtherIncome"]').fill(testData.financial.otherIncome)
        await page.locator('input[formcontrolname="proposerHouseholdIncome"]').fill(testData.financial.familyIncome)

        await page.locator('input[formcontrolname="spouseCareer"]').fill(testData.financial.spouseCareer)
        // 家中主要經濟來源
        await page.locator('input[formcontrolname="economicSources1"]').check()
        // 保費來源
        await page.locator('input[formcontrolname="insuranceFeeSources1"]').check({ force: true })
        await page.locator('input[formcontrolname="insuranceFeeSources3"]').check({ force: true })
        await page.locator('input[formcontrolname="insuranceFeeSources5"]').check({ force: true })
        await page.locator('input[formcontrolname="reasonAndSourcePremiums"]').fill(testData.financial.reason)
        await page.locator('input[formcontrolname="hasLoan"][value="N"]').check()
        await page.locator('input[formcontrolname="hasTermination"][value="N"]').check()
        // 負債
        await page.locator('input[formcontrolname="hasLiabilities"][value="Y"]').check()
        await page.locator('input[formcontrolname="proposerLiabilitiesType"]').fill(testData.financial.borrowType)
        await page.locator('input[formcontrolname="proposerTotalLiabilities"]').fill(testData.financial.borrowing)
        await page.locator('input[formcontrolname="insuredLiabilitiesType"]').fill(testData.financial.borrowType)
        await page.locator('input[formcontrolname="insuredTotalLiabilities"]').fill(testData.financial.borrowing)
        // 其他商業保險
        await page.locator('input[formcontrolname="proposerOtherInsuranceProducts"][value="0"]').check()
        await page.locator('input[formcontrolname="insuredOtherInsuranceProducts"][value="0"]').check()
        //    要保人是否對於本次購買商品之保障內容或給付項目完全不關心
        await page.locator('input[formcontrolname="proposerHighlyAttention"][value="1"]').check()
        await page.locator('input[formcontrolname="notAssignReason"]').type('NoNoNo')

        await page.locator('input[formcontrolname="notifyAgree"][value="0"]').check()
        if (testData.noteAndInsuredRecord.question_1==="Y") {
            await page.locator('input[formcontrolname="insuredHealthAbnormal"][value="1"]').check()
            await page.locator('input[formcontrolname="insuredHealthAbnormalState"]').fill("身心障礙")
        } else {
            await page.locator('input[formcontrolname="insuredHealthAbnormal"][value="0"]').check()
        }
        await page.locator('input[formcontrolname="militaryService"][value="1"]').check()

        await page.locator('input[formcontrolname="clerkStatement1"][value="0"]').check()
        await page.locator('input[formcontrolname="clerkStatement2"][value="0"]').check()
        await page.locator('input[formcontrolname="clerkStatement3"][value="0"]').check()
        await page.locator('input[formcontrolname="clerkStatement4"][value="0"]').check()
        await page.locator('input[formcontrolname="clerkStatement5"][value="0"]').check()

        await page.locator('input[formcontrolname="proposerTeleAccessTime1"]').check()
        await page.locator('input[formcontrolname="proposerTeleAccessNo"]').fill(testData.insured.phoneNumberNight)
        await page.locator('input[formcontrolname="insuredTeleAccessTime1"]').check()
        await page.locator('input[formcontrolname="insuredTeleAccessNo"]').fill(testData.insured.phoneNumberNight)
        await page.locator('input[formcontrolname="legalRepresentativeAccessNo"]').fill(testData.insured.phoneNumberNight)

        // 檢核儲存
        await clickSave(page)
    })
    
    test('疾病問卷', async () => {
        const pageName = '疾病問卷'
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, pageName))) { expect(true).toBe(true); return }
        
        // 新增
        await page.locator('.card-body > .btn').click()
        await page.locator('select[name="questionSelect"]').selectOption("Q-0001")
        await page.locator('select[name="insuredSelect"]').selectOption(testData.insured.baseInfoName)
        await page.locator('button[name="next"]').click()

        // 填寫
        // 1.
        await page.locator('input[formcontrolname="occurrenceYear"]').fill("111")
        await page.locator('input[formcontrolname="occurrenceMonth"]').fill("5")
        await page.locator('input[formcontrolname="occurrenceDay"]').fill("21")
        await page.locator('textarea[formcontrolname="cause"]').fill("這就是發生原因")
        // 2.
        await page.locator('input[formcontrolname="haveAnyConditions"][value="false"]').check()
        await page.locator('input[formcontrolname="conditions"]').nth(0).check()
        await page.locator('input[formcontrolname="conditions"]').nth(1).check()
        await page.locator('input[formcontrolname="conditions"]').nth(2).check()
        await page.locator('input[formcontrolname="conditions"]').nth(3).check()
        await page.locator('input[formcontrolname="lossConsciousness"][value="false"]').check()
        await page.locator('textarea[formcontrolname="coma"]').fill("昏迷了十年")
        await page.locator('input[formcontrolname="conditions"]').nth(4).check()
        await page.locator('textarea[formcontrolname="fractureSite"]').fill("全身粉粹性骨折")
        // 3.
        await page.locator('input[formcontrolname="hospitalized"][value="false"]').check()
        await page.locator('textarea[formcontrolname="hospitalizedDay"]').fill("11/05/21, 30天")
        await page.locator('input[formcontrolname="continuousTreatment"][value="false"]').check()
        await page.locator('input[formcontrolname="continuousTreatment"][value="true"]').check()
        await page.locator('input[formcontrolname="lastClinicYear"]').fill("111")
        await page.locator('input[formcontrolname="lastClinicMonth"]').fill("5")
        await page.locator('input[formcontrolname="lastClinicDay"]').fill("21")
        await page.locator('input[formcontrolname="surgicalTreatment"][value="false"]').check()
        await page.locator('textarea[formcontrolname="surgicalName"]').fill("改造手術")
        await page.locator('input[formcontrolname="implantation"][value="false"]').check()
        await page.locator('input[formcontrolname="takeOutYear"]').fill("111")
        await page.locator('input[formcontrolname="takeOutMonth"]').type("5")
        await page.locator('input[formcontrolname="takeOutDay"]').fill("21")
        await page.locator('input[formcontrolname="haveSuggestion"][value="false"]').check()
        await page.locator('textarea[formcontrolname="suggestion"]').fill("我沒有任何建議")
        // 4.
        await page.locator('input[formcontrolname="defect"][value="false"]').check()
        await page.locator('textarea[formcontrolname="defectDesc"]').fill("受傷有任何機能喪失或缺損")
        // 5.
        await page.locator('input[formcontrolname="haveSequelae"][value="false"]').check()
        await page.locator('input[formcontrolname="sequelae"]').nth(0).check()
        await page.locator('input[formcontrolname="sequelae"]').nth(1).check()
        await page.locator('input[formcontrolname="sequelae"]').nth(2).check()
        await page.locator('input[formcontrolname="sequelae"]').nth(3).check()
        await page.locator('input[formcontrolname="sequelae"]').nth(4).check()
        await page.locator('input[formcontrolname="sequelae"]').nth(5).check()
        await page.locator('input[formcontrolname="sequelae"]').nth(6).check()
        await page.locator('input[formcontrolname="sequelae"]').nth(7).check()
        await page.locator('textarea[formcontrolname="canNotMoveDesc"]').fill("我不能移動")
        await page.locator('input[formcontrolname="sequelae"]').nth(8).check()
        await page.locator('textarea[formcontrolname="sequelaeOther"]').fill("這是其他選項")
        // 6.
        await page.locator('input[formcontrolname="cured"][value="false"]').check()
        await page.locator('textarea[formcontrolname="unhealedDesc"]').fill("上為痊癒")
        // 7.
        await page.locator('textarea[formcontrolname="hospitalName"]').fill("臺大醫院")
        await page.locator('input[formcontrolname="hospitalLocation"]').fill("台北市公館區")
        await page.locator('textarea[formcontrolname="medicalRecordNumber"]').fill("RX-78-G3")

        await page.locator('button[name="next"]').click()

        // 檢核儲存
        await clickSave(page)
    })

    test('前往文件預覽', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }

        await page.waitForTimeout(shortSleep)

        let isExist = await checkIfExist(page, 'app-yes-no-dialog button.btn-primary')
        if (isExist) {
            await page.locator('app-yes-no-dialog button.btn-primary').click()
        } else {
            // 主動按下 檢核儲存
            await page.locator('div.page__content__btn.bottom-0.end-0 > button.btn-danger').click()

            // 如果有任何警告視窗,那就按
            clickDialog(page, true)

            await page.waitForTimeout(longSleep)

            // 是否進入文件預覽
            // 如果有任何警告視窗,那就按
            clickDialog(page, true)
        }

        await page.waitForResponse(res => res.url().includes('flow-step') && res.status() === 200)
        await page.waitForTimeout(shortSleep)
    })

    test('文件預覽', async () => {
        if (!(await mainStepIsMyTurn(page, 1))) { expect(true).toBe(true); return }

        const pdfCounts = await page.locator('tbody > tr').count()
        for(let i=0;i<pdfCounts;i++) {
            // 已經預覽的時間
            const pdfViewedTime = await page.locator('tbody > tr').nth(i).locator('td').nth(2).textContent()
            if (pdfViewedTime.trim()==='') {
                // 按下按鈕
                const viewPdfBtn = await page.locator('tbody > tr > td > button.btn-outline-info').nth(i)
                await Promise.all([
                    page.waitForResponse(res => res.url().includes('file') && res.status() === 200)
                    , await viewPdfBtn.click()
                ])
                await page.waitForTimeout(shortSleep)

                await pdfNextStepLoop(page)
                
                await page.waitForTimeout(shortSleep)

                // 是否預覽下一份文件, 選否
                await clickDialog(page, false)
            }
        }

        // 下一步
        await page.waitForTimeout(shortSleep)
        await Promise.all([
            page.waitForResponse(res => res.url().includes('flow-step') && res.status() === 200)
            , page.locator('button.btn.btn-primary').click()
        ])
        await page.waitForTimeout(shortSleep)
    })
    
    test('電子簽名', async () => {
        if (!(await mainStepIsMyTurn(page, 2))) { expect(true).toBe(true); return }

        // 分頁
        const tabCounts = await page.locator('.mdc-tab').count()
        for (let i=0;i<tabCounts;i++) {
            const tab = await page.locator('.mdc-tab').nth(i)
            await tab.click()

            // 每個簽名
            const signaturesBody = await page.locator('tbody')
            const signatureCounts = await signaturesBody.locator('div.signature__img').count()
            for (let j=0;j<signatureCounts;j++) {
                const divSignature = await signaturesBody.locator('div.signature__img').nth(j)
                const isDivExist = await divSignature.isVisible()
                if (isDivExist) {
                    // 有icon表示簽名過不再簽
                    const isSignatured = await divSignature.locator('div.signature__icon').isVisible()
                    if (!isSignatured) {
                        await divSignature.click()

                        // 開始簽名
                        await page.waitForTimeout(shortSleep)
                        const pad = await page.locator('canvas.signature-pad__pad').boundingBox()
                        let nowX = pad.width/2
                        let nowY = pad.height/2
                        for (let k=0;k<5;k++) {
                            await page.mouse.move(nowX, nowY)
                            await page.mouse.down()
                            nowX = pad.x + Math.random()*pad.width
                            nowY = pad.y + Math.random()*pad.height
                            await page.mouse.move(nowX, nowY, { steps: 10})
                            await page.mouse.up()
                        }

                        // 送出
                        await page.locator('.signature-pad__footer-btn--confirm').click()
                        await page.waitForTimeout(shortSleep)
                    }
                }
            }
        }

        // 下一步
        await page.waitForTimeout(shortSleep)
        await Promise.all([
            page.waitForResponse(res => res.url().includes('flow-step') && res.status() === 200)
            , page.locator('button.btn.btn-primary').click()
        ])
        await page.waitForTimeout(shortSleep)
    })

    test('上傳文件', async () => {
        if (!(await mainStepIsMyTurn(page, 3))) { expect(true).toBe(true); return }

        // 下一步
        await page.waitForTimeout(shortSleep)
        await Promise.all([
            page.waitForResponse(res => res.url().includes('flow-step') && res.status() === 200)
            , page.locator('button.btn.btn-primary').click()
        ])
        await page.waitForTimeout(shortSleep)
    })
    
    test('確認投保-預覽', async () => {
        if (!(await mainStepIsMyTurn(page, 4))) { expect(true).toBe(true); return }
        // 檢查是否已做完
        const targetPage = await page.locator('page__sidebar-items>div').nth(0)
        const targetClasslist = await targetPage.getAttribute('class')
        if (targetClasslist.includes('timeline-item--complete')) { expect(true).toBe(true); return }

        // 預覽
        const pdfCounts = await page.locator('tbody > tr').count()
        for(let i=0;i<pdfCounts;i++) {
            // 已經預覽的時間
            const pdfViewedTime = await page.locator('tbody > tr').nth(i).locator('td').nth(2).textContent()
            if (pdfViewedTime.trim()==='') {
                // 按下按鈕
                const viewPdfBtn = await page.locator('tbody > tr > td > button.btn-outline-info').nth(i)
                await Promise.all([
                    page.waitForResponse(res => res.url().includes('file') && res.status() === 200)
                    , await viewPdfBtn.click()
                ])
                await page.waitForTimeout(shortSleep)

                await pdfNextStepLoop(page)
                
                await page.waitForTimeout(shortSleep)

                // 是否預覽下一份文件, 選否
                await clickDialog(page, false)
            }
        }

        // 下一步
        await page.waitForTimeout(shortSleep)
        await page.locator('button.btn.btn-primary').click()
        await page.waitForTimeout(shortSleep)
    })
    
    test('確認投保-簽名', async () => {
        if (!(await mainStepIsMyTurn(page, 4))) { expect(true).toBe(true); return }
        // 檢查是否已做完
        const targetPage = await page.locator('page__sidebar-items>div').nth(1)
        const targetClasslist = await targetPage.getAttribute('class')
        if (targetClasslist.includes('timeline-item--complete')) { expect(true).toBe(true); return }

        // 分頁
        const tabCounts = await page.locator('.mdc-tab').count()
        for (let i=0;i<tabCounts;i++) {
            const tab = await page.locator('.mdc-tab').nth(i)
            await tab.click()

            // 每個簽名
            const signaturesBody = await page.locator('tbody')
            const signatureCounts = await signaturesBody.locator('div.signature__img').count()
            for (let j=0;j<signatureCounts;j++) {
                const divSignature = await signaturesBody.locator('div.signature__img').nth(j)
                const isDivExist = await divSignature.isVisible()
                if (isDivExist) {
                    // 有icon表示簽名過不再簽
                    const isSignatured = await divSignature.locator('div.signature__icon').isVisible()
                    if (!isSignatured) {
                        await divSignature.click()

                        // 開始簽名
                        await page.waitForTimeout(shortSleep)
                        const pad = await page.locator('canvas.signature-pad__pad').boundingBox()
                        let nowX = pad.width/2
                        let nowY = pad.height/2
                        for (let k=0;k<5;k++) {
                            await page.mouse.move(nowX, nowY)
                            await page.mouse.down()
                            nowX = pad.x + Math.random()*pad.width
                            nowY = pad.y + Math.random()*pad.height
                            await page.mouse.move(nowX, nowY, { steps: 10})
                            await page.mouse.up()
                        }

                        // 送出
                        await page.locator('.signature-pad__footer-btn--confirm').click()
                        await page.waitForTimeout(shortSleep)
                    }
                }
            }
        }
        
        // 下一步
        await page.waitForTimeout(shortSleep)
        await page.locator('button.btn.btn-primary').click()
        await page.waitForTimeout(shortSleep)
    })
})