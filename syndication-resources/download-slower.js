// SLOWER download script - 2 second delay between files to prevent throttling
// Run this on the Syndication Superstars page while logged in

const downloadUrls = [
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157983237/quick_analysis-xlsx", name: "Quick_Analysis.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157983238/quick_template_v2-xlsx", name: "Quick_Template_v2.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157983240/template_v09_blank-xlsx", name: "Template_v09_Blank.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157983241/template_v09-xlsx", name: "Template_v09.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2158113081/mfa-free-v1-01-xlsx", name: "MFA_v1.01.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2158113084/mfa-underwriting-checklist-xlsx", name: "MFA_Underwriting_Checklist.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2158113072/mfa-market-analysis-xlsx", name: "MFA_Market_Analysis.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985838/sample_letter-docx", name: "Sample_Letter.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985840/sample_2-doc", name: "Sample_Letter_2.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985842/sample_3-doc", name: "Sample_Letter_3.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985843/sample_4-doc", name: "Sample_Letter_4.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157994077/sa26c0_1-doc", name: "Sample_Letter_5.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985942/loi_1-docx", name: "LOI_1.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985945/loi_2-docx", name: "LOI_2.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985946/loi_3-docx", name: "LOI_3.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985947/loi_4-docx", name: "LOI_4.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985950/master_lease_option_loi-pdf", name: "Master_Lease_Option_LOI.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985954/assign_2-doc", name: "Assignment_of_Contract_v2.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985955/assign_3-doc", name: "Assignment_of_Contract_v3.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985957/purcha_2-doc", name: "Purchase_Sale_Agreement_Option2.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985956/purcha_1-doc", name: "Purchase_Sale_Agreement_Long_Form.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985958/sales_1-doc", name: "Sales_Contract_Wrap_Around.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985959/sample_1-doc", name: "Sample_Purchase_Sale_Agreement.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985960/sample_1-txt", name: "SAMPLES_ONLY_CONSULT_ATTORNEY.txt"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985961/single_1-doc", name: "Single_Family_Sales_Contract.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985962/standa_1-doc", name: "Standard_RE_Purchase_Sale_Agreement.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985963/wholes_1-doc", name: "Wholesaling_Purchase_Sale_Agreement.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985964/broker_phone_call_script_1-docx", name: "Broker_Phone_Call_Script_1.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985965/broker_phone_call_script_2-docx", name: "Broker_Phone_Call_Script_2.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985966/questions_to_ask_seller-docx", name: "Questions_To_Ask_Seller.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985967/seller_cold_call_script-docx", name: "Seller_Cold_Call_Script.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985985/reques_1-doc", name: "Requested_Documents_From_Seller.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985984/normalizing_expenses-xlsx", name: "Normalizing_Expenses.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985983/multif_2-doc", name: "Multifamily_Property_Checklist.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985982/mastering_mf_acquisitions-xlsx", name: "Mastering_MF_Acquisitions.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985981/investment_criteria_checklist-docx", name: "Investment_Criteria_Checklist.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985980/garden_villas_om-pdf", name: "Garden_Villas_OM.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985979/due_diligence_checklist-xlsx", name: "Due_Diligence_Checklist.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985978/due_diligence_checklist-docx", name: "Due_Diligence_Checklist.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985977/driving_for_dollars_template-xlsx", name: "Driving_for_Dollars_Template.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985976/basic_property_purchase_worksheet-docx", name: "Basic_Property_Purchase_Worksheet.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985975/apartm_2-doc", name: "Apartments_Initial_Seller_Conversation.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985974/apartm_1-pdf", name: "Apartments_Initial_Seller_Conversation.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985973/apartm_1-doc", name: "Apartment_Exterior_Inspection_Report.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985972/advanc_1-pdf", name: "Advanced_Multifamily_Property_Checklist.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985971/_cash_on_return_what_if_analysis-png", name: "Cash_On_Return_What_If_Analysis.png"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985989/sample_llc_operating_agreement-docx", name: "Sample_LLC_Operating_Agreement.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985988/master_lease_agreement_template-1-doc", name: "Master_Lease_Agreement_Template.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985987/confid_1-doc", name: "Confidentiality_Non_Circumvent_Agreement.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985993/sample-apartment-appraisal-pdf", name: "Sample_Apartment_Appraisal.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985992/phase-1-example-pdf", name: "Phase_1_Example.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985991/explaining_seller_financing_script-docx", name: "Explaining_Seller_Financing_Script.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985990/bank_script-docx", name: "Bank_Script.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986004/theult_1-doc", name: "Ultimate_Goal_Setting_Worksheet.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986003/self_evaluation_checklist-docx", name: "Self_Evaluation_Checklist.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986001/quadrants-jpg", name: "Quadrants.jpg"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986000/maslow_s_hierarchy_of_needs-png", name: "Maslows_Hierarchy_Of_Needs.png"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985999/energy_audit-docx", name: "Energy_Audit.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985998/daily_work_schedule-pdf", name: "Daily_Work_Schedule.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157985997/90-year_human_life_in_months-png", name: "90_Year_Human_Life_In_Months.png"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986008/the_four_markets_to_invest_in-pdf", name: "The_Four_Markets_To_Invest_In.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986006/real_estate_market_analysis_v3-xlsx", name: "Real_Estate_Market_Analysis_v3.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986018/the_multifamily_investing_process-pdf", name: "The_Multifamily_Investing_Process.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986017/the_5-30_unit_strategy-pdf", name: "The_5-30_Unit_Strategy.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986016/master_the_lingo-pdf", name: "Master_the_Lingo.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986015/link_library-docx", name: "Link_Library.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986014/harborside_partners_investment_criteria-pdf", name: "Harborside_Partners_Investment_Criteria.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986013/class_a-d_breakdown-pdf", name: "Class_A-D_Breakdown.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986010/29_fatal_mistakes-pdf", name: "29_Fatal_Mistakes.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986038/update_1-doc", name: "Questions_Property_Management_Company.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986037/tenant_1-doc", name: "Tenant_Estoppel_Certificate.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986036/short_1-doc", name: "Notice_of_Unit_Inspection.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986035/sample_1-doc", name: "Sample_Property_Management_Agreement.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986034/reside_1-doc", name: "Residential_Lease_Extension_Agreement.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986033/rental_1-pdf", name: "Rental_Application_Advanced.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986032/notice_4-doc", name: "Notice_to_Tenant_Vacate.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986031/notice_3-doc", name: "Notice_New_Property_Management.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986030/notice_2-doc", name: "Notice_of_Lease_Renewal.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986029/notice_1-doc", name: "Notice_Inspection_Intent_to_Enter.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986028/non_pa_1-doc", name: "Non_Payment_Eviction_Letter.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986027/move_i_1-doc", name: "Move_In_Move_Out_Checklist.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986026/mainte_1-doc", name: "Maintenance_Repair_Work_Order.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986024/lease_2-doc", name: "Lease_Renewal_with_Rental_Increase.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986023/lease_1-doc", name: "Lease_Agreement_SAMPLE.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986022/hud_le_1-pdf", name: "HUD_Lead_Based_Paint_Pamphlet.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986021/addend_1-doc", name: "Addendum_to_Lease_Modifying_Terms.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986050/vacanc_1-pdf", name: "Vacancy_Report.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986048/rentroll-pdf", name: "Rent_Roll.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986046/recapr_1-pdf", name: "Recap_Report.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986045/profit_1-pdf", name: "Profit_Loss_12_Month_Recap.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986044/openwo_1-pdf", name: "Open_Work_Orders.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986043/fiscal_1-pdf", name: "Fiscal_Year_Budget.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986042/detail_1-pdf", name: "Detailed_Delinquency_Report.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986041/cashfl_2-pdf", name: "Cash_Flow_Details.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986040/cashfl_1-pdf", name: "Cash_Flow_Comparison.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986039/budget_1-pdf", name: "Budget_Comparison.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986065/the_real_estate_syndication_process-pdf", name: "Real_Estate_Syndication_Process.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986064/syndication_legal_timeline-png", name: "Syndication_Legal_Timeline.png"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986063/questions_an_investor_should_ask_a_syndicator-pdf", name: "Questions_Investor_Ask_Syndicator.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986062/nuts_and_bolts_of_a_syndication-pdf", name: "Nuts_and_Bolts_of_Syndication.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986061/investor_suitability_questionnaire_-pdf", name: "Investor_Suitability_Questionnaire.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986060/how_to_structure_a_syndicate-pdf", name: "How_to_Structure_a_Syndicate.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986059/how_to_structure_a_real_estate_syndicate-jpg", name: "How_to_Structure_RE_Syndicate.jpg"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986058/gp_split_worksheet-xlsx", name: "GP_Split_Worksheet.xlsx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986056/fund_structure-png", name: "Fund_Structure.png"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986055/example_org_chart-pdf", name: "Example_Org_Chart.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986054/506_b_506_c-jpg", name: "506b_506c_Comparison.jpg"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986071/multif_1-pdf", name: "Multifamily_Networking_Checklist.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986070/listof_1-doc", name: "List_Team_Members_Checklist.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986069/fullli_1-pdf", name: "Full_List_Partnership_Questions.pdf"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986068/exampl_1-doc", name: "Example_Memorandum_of_Understanding.doc"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986075/database_manager_job_ad-1-docx", name: "Database_Manager_Job_Ad.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986074/database_manager_agreement-docx", name: "Database_Manager_Agreement.docx"},
  {url: "https://training.syndicationsuperstars.com/courses/downloads/2157986073/blank_invoice-docx", name: "Blank_Invoice.docx"}
];

// Configuration - adjust if needed
const DELAY_MS = 2000;  // 2 seconds between downloads (slower = more reliable)
const START_INDEX = 0;  // Change this to skip already-downloaded files

let index = START_INDEX;
let downloaded = 0;

function downloadNext() {
  if (index >= downloadUrls.length) {
    console.log(`\n✅ ALL DONE! Downloaded: ${downloaded} files`);
    return;
  }
  
  const {url, name} = downloadUrls[index];
  console.log(`[${index + 1}/${downloadUrls.length}] ${name}`);
  
  // Use window.open which is less likely to be blocked
  const win = window.open(url, '_blank');
  if (win) {
    setTimeout(() => win.close(), 1000);
  }
  
  downloaded++;
  index++;
  
  // Show progress every 10 files
  if (downloaded % 10 === 0) {
    console.log(`📊 Progress: ${downloaded} files downloaded...`);
  }
  
  setTimeout(downloadNext, DELAY_MS);
}

console.log('🚀 Starting SLOWER downloads (2 sec between each)...');
console.log(`📁 Starting from index: ${START_INDEX}`);
console.log(`⏱️ Total time: ~${Math.ceil(downloadUrls.length * DELAY_MS / 60000)} minutes\n`);
console.log('⚠️ ALLOW POP-UPS if prompted!\n');

downloadNext();
