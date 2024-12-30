// @ts-check
const { test, expect } = require('@playwright/test')
const { pdfNextStepLoop, clickSave, mainStepIsMyTurn, subStepIsMyTurn, checkIfExist } = require('./Commands')

import { solver } from '../support/CAPTCHAsolver'
import testData from '../fixtures/0.0.0-sample.json'

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
        await page.goto('/mbis/#/login?admin=TGL@70817744@tgl')

        await page.locator('#uname').fill(testData.userId)
        await page.locator('#pin').fill(testData.pin)
        await solver(page)
        await page.getByRole('button', { name: '登入' }).click()
        await page.waitForTimeout(longSleep)
    })

    test('新增/修改', async () => {
        if (newRecord) {
            await Promise.all([
                page.waitForResponse(res => res.url().includes('getPdfDocument') && res.status() === 200)
                , page.locator('.order-lg-1 > .card > .card-body > :nth-child(1) > :nth-child(1) > .me-2 > .row > a > .avatar-md > .avatar-title').click({ force: true })
                , page.waitForTimeout(longSleep)
            ])
            // 同意書
            const isExist = await checkIfExist(page, 'app-preview-dialog button.btn-success')
            if (isExist) {
                pdfNextStepLoop(page)
            }
        }
        else {
            await Promise.all([
                page.locator(':nth-child(1) > :nth-child(6) > :nth-child(1) > .ri-edit-2-line').click()
                , page.waitForTimeout(longSleep)
            ])

            const isExist = await checkIfExist(page, 'app-normal-dialog button.btn-primary')
            if (isExist) {
                await page.locator('app-normal-dialog button.btn-primary').click()
            }
        }
    })

    test('被保險人', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '被保險人'))) { expect(true).toBe(true); return }

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
        clickSave(page)
    })

    test('要保人', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '要保人'))) { expect(true).toBe(true); return }

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
        clickSave(page)
    })

    test('風險屬性', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '風險'))) { expect(true).toBe(true); return }

        await page.locator('#isInvestN').check()

        // 檢核儲存
        clickSave(page)
    })

    test('保險種類', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '保險種類'))) { expect(true).toBe(true); return }

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
        clickSave(page)
    })

    test('詢問事項', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '詢問事項'))) { expect(true).toBe(true); return }

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
        clickSave(page)
    })

    test('要保人帳戶', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '要保人帳戶'))) { expect(true).toBe(true); return }
        
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
        clickSave(page)
    })

    test('自動墊繳', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '自動墊繳'))) { expect(true).toBe(true); return }
        
        await page.locator('#autoPayment_left0').click()
        await page.locator('#payer_relations0_1').scrollIntoViewIfNeeded()
        await page.locator('#payer_relations0_1').click()

        // 檢核儲存
        clickSave(page)
    })

    test('受益人', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '受益人'))) { expect(true).toBe(true); return }
        
        let isExist = false
        const counts = await page.locator('.mat-mdc-tab-labels > div').count()
        for(let i=0; i<counts; i++) {
            const $tab = await page.locator('.mat-mdc-tab-labels > div').nth(i)
            // 切換主約分頁
            await $tab.click()
            const tagName = await $tab.textContent()

            // 身故保險金受益人
            const tagDeadName = `#cradio1dead${tagName}`
            isExist = await checkIfExist(page, tagDeadName)
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
        clickSave(page)
    })

    test('告知事項', async () => {
        if (!(await mainStepIsMyTurn(page, 0))) { expect(true).toBe(true); return }
        if (!(await subStepIsMyTurn(page, '告知事項'))) { expect(true).toBe(true); return }
        
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
        clickSave(page)
    })
})