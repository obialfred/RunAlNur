// BATCH DOWNLOAD ALL 114 FILES
// Paste this into your browser console while logged into the Kajabi site
// Files will download to your default Downloads folder

const downloadUrls = [
  "https://training.syndicationsuperstars.com/courses/downloads/2157983237/quick_analysis-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157983238/quick_template_v2-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157983240/template_v09_blank-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157983241/template_v09-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2158113081/mfa-free-v1-01-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2158113084/mfa-underwriting-checklist-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2158113072/mfa-market-analysis-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985838/sample_letter-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985840/sample_2-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985842/sample_3-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985843/sample_4-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157994077/sa26c0_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985942/loi_1-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985945/loi_2-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985946/loi_3-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985947/loi_4-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985950/master_lease_option_loi-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985954/assign_2-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985955/assign_3-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985957/purcha_2-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985956/purcha_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985958/sales_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985959/sample_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985960/sample_1-txt",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985961/single_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985962/standa_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985963/wholes_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985964/broker_phone_call_script_1-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985965/broker_phone_call_script_2-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985966/questions_to_ask_seller-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985967/seller_cold_call_script-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985985/reques_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985984/normalizing_expenses-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985983/multif_2-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985982/mastering_mf_acquisitions-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985981/investment_criteria_checklist-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985980/garden_villas_om-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985979/due_diligence_checklist-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985978/due_diligence_checklist-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985977/driving_for_dollars_template-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985976/basic_property_purchase_worksheet-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985975/apartm_2-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985974/apartm_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985973/apartm_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985972/advanc_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985971/_cash_on_return_what_if_analysis-png",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985989/sample_llc_operating_agreement-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985988/master_lease_agreement_template-1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985987/confid_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985993/sample-apartment-appraisal-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985992/phase-1-example-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985991/explaining_seller_financing_script-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985990/bank_script-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986004/theult_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986003/self_evaluation_checklist-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986001/quadrants-jpg",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986000/maslow_s_hierarchy_of_needs-png",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985999/energy_audit-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985998/daily_work_schedule-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157985997/90-year_human_life_in_months-png",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986008/the_four_markets_to_invest_in-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986006/real_estate_market_analysis_v3-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986018/the_multifamily_investing_process-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986017/the_5-30_unit_strategy-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986016/master_the_lingo-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986015/link_library-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986014/harborside_partners_investment_criteria-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986013/class_a-d_breakdown-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986010/29_fatal_mistakes-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986038/update_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986037/tenant_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986036/short_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986035/sample_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986034/reside_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986033/rental_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986032/notice_4-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986031/notice_3-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986030/notice_2-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986029/notice_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986028/non_pa_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986027/move_i_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986026/mainte_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986024/lease_2-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986023/lease_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986022/hud_le_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986021/addend_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986050/vacanc_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986048/rentroll-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986046/recapr_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986045/profit_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986044/openwo_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986043/fiscal_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986042/detail_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986041/cashfl_2-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986040/cashfl_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986039/budget_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986065/the_real_estate_syndication_process-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986064/syndication_legal_timeline-png",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986063/questions_an_investor_should_ask_a_syndicator-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986062/nuts_and_bolts_of_a_syndication-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986061/investor_suitability_questionnaire_-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986060/how_to_structure_a_syndicate-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986059/how_to_structure_a_real_estate_syndicate-jpg",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986058/gp_split_worksheet-xlsx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986056/fund_structure-png",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986055/example_org_chart-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986054/506_b_506_c-jpg",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986071/multif_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986070/listof_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986069/fullli_1-pdf",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986068/exampl_1-doc",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986075/database_manager_job_ad-1-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986074/database_manager_agreement-docx",
  "https://training.syndicationsuperstars.com/courses/downloads/2157986073/blank_invoice-docx"
];

console.log(`🚀 Starting batch download of ${downloadUrls.length} files...`);
console.log('Files will download to your browser\'s default download folder.\n');

let downloadIndex = 0;
const downloadInterval = setInterval(() => {
  if (downloadIndex >= downloadUrls.length) {
    clearInterval(downloadInterval);
    console.log('\n✅ ALL DOWNLOADS COMPLETE!');
    console.log(`Downloaded ${downloadUrls.length} files to your Downloads folder.`);
    return;
  }
  
  const url = downloadUrls[downloadIndex];
  const filename = url.split('/').pop();
  console.log(`📥 [${downloadIndex + 1}/${downloadUrls.length}] Downloading: ${filename}`);
  
  // Create a temporary link and click it
  const a = document.createElement('a');
  a.href = url;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  downloadIndex++;
}, 800); // 800ms delay between downloads to avoid overwhelming

console.log('Downloads starting... This will take about 2 minutes.');
console.log('Check your browser\'s download manager (Ctrl/Cmd+J) to see progress.');
