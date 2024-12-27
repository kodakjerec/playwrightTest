// @ts-check
const { test, expect } = require('@playwright/test')
const { pdfNextStepLoop, clickSave } = require('./Commands')

import { solver } from '../support/CAPTCHAsolver'
import testData from '../fixtures/0.0.0-sample.json'

/* 本次測試時間 */
const now =new Date()
const month = now.getMonth()+1
const date = now.getDate()
const hours = now.getHours()
const minutes = now.getMinutes()
const testTime = `日期${month}${date}${hours}${minutes}`

/* 本次測試參數 */
let newRecord = true // true-新增 false-修改

/* Seetings */
test.describe.configure({ mode: 'serial' })

let page // 共用page
test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
})
test.afterAll(async () => {
  await page.close()
})
const shortSleep = 300 // 短暫休息
const longSleep = 1500 // 長休息

/* ---------分隔線------------------------------------------------------------------------ */

/* RUN */
test.describe('測試連線', ()=>{

  test('登入', async () => {
    await page.goto('https://mpos.transglobe.com.tw/mbis/#/login?admin=TGL@70817744@tgl')

    await page.locator('#uname').fill(testData.userId)
    await page.locator('#pin').fill(testData.pin)
    await solver(page)
    await page.getByRole('button', { name: '登入' }).click()
    await page.waitForTimeout(longSleep)
  })

  test('新增', async() => {
    if (newRecord) {
      await Promise.all([
        page.waitForResponse(res => res.url().includes('getPdfDocument') && res.status()===200)
        ,page.locator('.order-lg-1 > .card > .card-body > :nth-child(1) > :nth-child(1) > .me-2 > .row > a > .avatar-md > .avatar-title').click({ force: true })
        ,page.waitForTimeout(longSleep)
      ])
      // 同意書
      const isExist = await page.locator('app-preview-dialog button.btn-success').isVisible()
      if (isExist) {
        pdfNextStepLoop(page)
      }
    }
  })

  test('修改', async() => {
    if (!newRecord) {
      await Promise.all([
        page.locator(':nth-child(1) > :nth-child(6) > :nth-child(1) > .ri-edit-2-line').click()
        ,page.waitForTimeout(longSleep)
      ])

      const isExist = await page.locator('app-normal-dialog button.btn-primary').isVisible()
      if (isExist) {
        await page.locator('app-normal-dialog button.btn-primary').click()
      }
    }
  })
})

let testConponentText = ''
test.describe('資料輸入', () => {
  test('被保險人', async() => {
    await page.locator('input[formcontrolname="baseInfoName"]').fill(testData.insured.baseInfoName)
    await page.locator('input[formcontrolname="baseInfoGender"]').first().click()
    await page.locator('input[formcontrolname="baseInfoPersonId"]').fill(testData.insured.baseInfoPersonId)
    await page.locator('input[formcontrolname="baseInfoRomanName"]').fill(testData.insured.baseInfoName)

    // 日期(切換成成年日期)
    await page.locator('.mat-datepicker-input').fill(testData.insured.baseInfoBirthday)

    await page.locator('select[formcontrolname="baseInfoMarry"]').selectOption(testData.insured.baseInfoMarry)
    if (testData.insured.baseInfoNationality=="中華民國")
        await page.locator('input[formcontrolname="baseInfoNationalIsROC"]').check()
    else
        await page.locator('select[formcontrolname="baseInfoNationality"]').selectOption(testData.insured.baseInfoNationality)
    await page.locator('input[formcontrolname="serviceUnit"]').fill(testData.insured.serviceUnit)
    await page.locator('input[formcontrolname="workDetail"]').fill(testData.insured.workDetail)
    await page.locator('input[formcontrolname="partTimeDetail"]').fill(testData.insured.partTimeDetail)

    // 正職職業代碼 A101
    await Promise.all([
      await page.locator('input[formcontrolname="jobInfoCareerFull"]').click()
      ,page.waitForResponse(res => res.url().includes('getSICInfo') && res.status()===200)
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
      ,page.waitForResponse(res => res.url().includes('getSICInfo') && res.status()===200)
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

  test('要保人', async() => {
    // ***** 以下為要保人輸入 *****
    await page.locator('select[formcontrolname="relation"]').selectOption(testData.proposer.relation)
    await page.locator('input[formcontrolname="infoName"]').fill(testTime)
    await page.locator('input[formcontrolname="infoGender"]').last().click()
    await page.locator('input[formcontrolname="infoPersonId"]').fill(testData.proposer.infoPersonId)
    await page.locator('input[formcontrolname="romanName"]').fill(testData.proposer.romanName)

    // 日期(切換成成年日期)
    await page.locator('.mat-datepicker-input').fill(testData.proposer.infoBirthday)

    // 國籍
    if (testData.proposer.infoNational=="中華民國")
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
    await page.locator('input[formcontrolname="policyfill"]').first().check()

    // 風險同意書
    await page.locator('#pointer').click()
    await page.locator('.col-10 > :nth-child(1) > .form-check-label').last().click()
    await page.locator('.modal-footer > .btn').click()

    // 檢核儲存
    clickSave(page)
  })
})