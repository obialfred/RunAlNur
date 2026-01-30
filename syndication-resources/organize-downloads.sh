#!/bin/bash
# Organize Syndication Superstars downloads into folder structure
# Run this after all files have downloaded

DOWNLOADS=~/Downloads
DEST="/Users/obi/Projects/RunAlNur/RunAlNur/syndication-resources"

echo "🗂️  Organizing Syndication Superstars course files..."
echo ""

# Analysis files
mv "$DOWNLOADS/Quick_Analysis.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Analysis/" 2>/dev/null && echo "✓ Quick_Analysis.xlsx"
mv "$DOWNLOADS/quick_template_v2.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Analysis/" 2>/dev/null && echo "✓ quick_template_v2.xlsx"
mv "$DOWNLOADS/template_v09_blank.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Analysis/" 2>/dev/null && echo "✓ template_v09_blank.xlsx"
mv "$DOWNLOADS/template_v09.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Analysis/" 2>/dev/null && echo "✓ template_v09.xlsx"
mv "$DOWNLOADS/mfa-free-v1-01.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Analysis/" 2>/dev/null && echo "✓ mfa-free-v1-01.xlsx"
mv "$DOWNLOADS/mfa-underwriting-checklist.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Analysis/" 2>/dev/null && echo "✓ mfa-underwriting-checklist.xlsx"
mv "$DOWNLOADS/mfa-market-analysis.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Analysis/" 2>/dev/null && echo "✓ mfa-market-analysis.xlsx"

# Direct Mail Letters
mv "$DOWNLOADS/sample_letter.docx" "$DEST/01-Deal-Sourcing-and-Analysis/Direct-Mail-Letters/" 2>/dev/null && echo "✓ sample_letter.docx"
mv "$DOWNLOADS/sample_2.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Direct-Mail-Letters/" 2>/dev/null && echo "✓ sample_2.doc"
mv "$DOWNLOADS/sample_3.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Direct-Mail-Letters/" 2>/dev/null && echo "✓ sample_3.doc"
mv "$DOWNLOADS/sample_4.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Direct-Mail-Letters/" 2>/dev/null && echo "✓ sample_4.doc"
mv "$DOWNLOADS/sa26c0_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Direct-Mail-Letters/" 2>/dev/null && echo "✓ sa26c0_1.doc"

# LOIs
mv "$DOWNLOADS/loi_1.docx" "$DEST/01-Deal-Sourcing-and-Analysis/LOIs/" 2>/dev/null && echo "✓ loi_1.docx"
mv "$DOWNLOADS/loi_2.docx" "$DEST/01-Deal-Sourcing-and-Analysis/LOIs/" 2>/dev/null && echo "✓ loi_2.docx"
mv "$DOWNLOADS/loi_3.docx" "$DEST/01-Deal-Sourcing-and-Analysis/LOIs/" 2>/dev/null && echo "✓ loi_3.docx"
mv "$DOWNLOADS/loi_4.docx" "$DEST/01-Deal-Sourcing-and-Analysis/LOIs/" 2>/dev/null && echo "✓ loi_4.docx"
mv "$DOWNLOADS/master_lease_option_loi.pdf" "$DEST/01-Deal-Sourcing-and-Analysis/LOIs/" 2>/dev/null && echo "✓ master_lease_option_loi.pdf"

# Purchase and Sale Documents
mv "$DOWNLOADS/assign_2.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ assign_2.doc"
mv "$DOWNLOADS/assign_3.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ assign_3.doc"
mv "$DOWNLOADS/purcha_2.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ purcha_2.doc"
mv "$DOWNLOADS/purcha_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ purcha_1.doc"
mv "$DOWNLOADS/sales_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ sales_1.doc"
mv "$DOWNLOADS/sample_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ sample_1.doc"
mv "$DOWNLOADS/sample_1.txt" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ sample_1.txt"
mv "$DOWNLOADS/single_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ single_1.doc"
mv "$DOWNLOADS/standa_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ standa_1.doc"
mv "$DOWNLOADS/wholes_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Purchase-and-Sale-Documents/" 2>/dev/null && echo "✓ wholes_1.doc"

# Scripts
mv "$DOWNLOADS/broker_phone_call_script_1.docx" "$DEST/01-Deal-Sourcing-and-Analysis/Scripts/" 2>/dev/null && echo "✓ broker_phone_call_script_1.docx"
mv "$DOWNLOADS/broker_phone_call_script_2.docx" "$DEST/01-Deal-Sourcing-and-Analysis/Scripts/" 2>/dev/null && echo "✓ broker_phone_call_script_2.docx"
mv "$DOWNLOADS/questions_to_ask_seller.docx" "$DEST/01-Deal-Sourcing-and-Analysis/Scripts/" 2>/dev/null && echo "✓ questions_to_ask_seller.docx"
mv "$DOWNLOADS/seller_cold_call_script.docx" "$DEST/01-Deal-Sourcing-and-Analysis/Scripts/" 2>/dev/null && echo "✓ seller_cold_call_script.docx"

# Deal Sourcing Miscellaneous
mv "$DOWNLOADS/reques_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ reques_1.doc"
mv "$DOWNLOADS/normalizing_expenses.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ normalizing_expenses.xlsx"
mv "$DOWNLOADS/multif_2.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ multif_2.doc"
mv "$DOWNLOADS/mastering_mf_acquisitions.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ mastering_mf_acquisitions.xlsx"
mv "$DOWNLOADS/investment_criteria_checklist.docx" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ investment_criteria_checklist.docx"
mv "$DOWNLOADS/garden_villas_om.pdf" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ garden_villas_om.pdf"
mv "$DOWNLOADS/due_diligence_checklist.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ due_diligence_checklist.xlsx"
mv "$DOWNLOADS/due_diligence_checklist.docx" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ due_diligence_checklist.docx"
mv "$DOWNLOADS/driving_for_dollars_template.xlsx" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ driving_for_dollars_template.xlsx"
mv "$DOWNLOADS/basic_property_purchase_worksheet.docx" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ basic_property_purchase_worksheet.docx"
mv "$DOWNLOADS/apartm_2.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ apartm_2.doc"
mv "$DOWNLOADS/apartm_1.pdf" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ apartm_1.pdf"
mv "$DOWNLOADS/apartm_1.doc" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ apartm_1.doc"
mv "$DOWNLOADS/advanc_1.pdf" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ advanc_1.pdf"
mv "$DOWNLOADS/_cash_on_return_what_if_analysis.png" "$DEST/01-Deal-Sourcing-and-Analysis/Miscellaneous/" 2>/dev/null && echo "✓ _cash_on_return_what_if_analysis.png"

# Entities and Legal
mv "$DOWNLOADS/sample_llc_operating_agreement.docx" "$DEST/02-Entities-and-Legal/" 2>/dev/null && echo "✓ sample_llc_operating_agreement.docx"
mv "$DOWNLOADS/master_lease_agreement_template-1.doc" "$DEST/02-Entities-and-Legal/" 2>/dev/null && echo "✓ master_lease_agreement_template-1.doc"
mv "$DOWNLOADS/confid_1.doc" "$DEST/02-Entities-and-Legal/" 2>/dev/null && echo "✓ confid_1.doc"

# Financing
mv "$DOWNLOADS/sample-apartment-appraisal.pdf" "$DEST/03-Financing/" 2>/dev/null && echo "✓ sample-apartment-appraisal.pdf"
mv "$DOWNLOADS/phase-1-example.pdf" "$DEST/03-Financing/" 2>/dev/null && echo "✓ phase-1-example.pdf"
mv "$DOWNLOADS/explaining_seller_financing_script.docx" "$DEST/03-Financing/" 2>/dev/null && echo "✓ explaining_seller_financing_script.docx"
mv "$DOWNLOADS/bank_script.docx" "$DEST/03-Financing/" 2>/dev/null && echo "✓ bank_script.docx"

# Goal Setting and Evaluation
mv "$DOWNLOADS/theult_1.doc" "$DEST/04-Goal-Setting-and-Evaluation/" 2>/dev/null && echo "✓ theult_1.doc"
mv "$DOWNLOADS/self_evaluation_checklist.docx" "$DEST/04-Goal-Setting-and-Evaluation/" 2>/dev/null && echo "✓ self_evaluation_checklist.docx"
mv "$DOWNLOADS/quadrants.jpg" "$DEST/04-Goal-Setting-and-Evaluation/" 2>/dev/null && echo "✓ quadrants.jpg"
mv "$DOWNLOADS/maslow_s_hierarchy_of_needs.png" "$DEST/04-Goal-Setting-and-Evaluation/" 2>/dev/null && echo "✓ maslow_s_hierarchy_of_needs.png"
mv "$DOWNLOADS/energy_audit.docx" "$DEST/04-Goal-Setting-and-Evaluation/" 2>/dev/null && echo "✓ energy_audit.docx"
mv "$DOWNLOADS/daily_work_schedule.pdf" "$DEST/04-Goal-Setting-and-Evaluation/" 2>/dev/null && echo "✓ daily_work_schedule.pdf"
mv "$DOWNLOADS/90-year_human_life_in_months.png" "$DEST/04-Goal-Setting-and-Evaluation/" 2>/dev/null && echo "✓ 90-year_human_life_in_months.png"

# Markets
mv "$DOWNLOADS/the_four_markets_to_invest_in.pdf" "$DEST/05-Markets/" 2>/dev/null && echo "✓ the_four_markets_to_invest_in.pdf"
mv "$DOWNLOADS/real_estate_market_analysis_v3.xlsx" "$DEST/05-Markets/" 2>/dev/null && echo "✓ real_estate_market_analysis_v3.xlsx"

# Multifamily Basics
mv "$DOWNLOADS/the_multifamily_investing_process.pdf" "$DEST/06-Multifamily-Basics/" 2>/dev/null && echo "✓ the_multifamily_investing_process.pdf"
mv "$DOWNLOADS/the_5-30_unit_strategy.pdf" "$DEST/06-Multifamily-Basics/" 2>/dev/null && echo "✓ the_5-30_unit_strategy.pdf"
mv "$DOWNLOADS/master_the_lingo.pdf" "$DEST/06-Multifamily-Basics/" 2>/dev/null && echo "✓ master_the_lingo.pdf"
mv "$DOWNLOADS/link_library.docx" "$DEST/06-Multifamily-Basics/" 2>/dev/null && echo "✓ link_library.docx"
mv "$DOWNLOADS/harborside_partners_investment_criteria.pdf" "$DEST/06-Multifamily-Basics/" 2>/dev/null && echo "✓ harborside_partners_investment_criteria.pdf"
mv "$DOWNLOADS/class_a-d_breakdown.pdf" "$DEST/06-Multifamily-Basics/" 2>/dev/null && echo "✓ class_a-d_breakdown.pdf"
mv "$DOWNLOADS/29_fatal_mistakes.pdf" "$DEST/06-Multifamily-Basics/" 2>/dev/null && echo "✓ 29_fatal_mistakes.pdf"

# Property Management Documents
mv "$DOWNLOADS/update_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ update_1.doc"
mv "$DOWNLOADS/tenant_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ tenant_1.doc"
mv "$DOWNLOADS/short_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ short_1.doc"
# Note: sample_1.doc might conflict - will need manual check
mv "$DOWNLOADS/reside_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ reside_1.doc"
mv "$DOWNLOADS/rental_1.pdf" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ rental_1.pdf"
mv "$DOWNLOADS/notice_4.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ notice_4.doc"
mv "$DOWNLOADS/notice_3.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ notice_3.doc"
mv "$DOWNLOADS/notice_2.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ notice_2.doc"
mv "$DOWNLOADS/notice_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ notice_1.doc"
mv "$DOWNLOADS/non_pa_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ non_pa_1.doc"
mv "$DOWNLOADS/move_i_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ move_i_1.doc"
mv "$DOWNLOADS/mainte_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ mainte_1.doc"
mv "$DOWNLOADS/lease_2.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ lease_2.doc"
mv "$DOWNLOADS/lease_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ lease_1.doc"
mv "$DOWNLOADS/hud_le_1.pdf" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ hud_le_1.pdf"
mv "$DOWNLOADS/addend_1.doc" "$DEST/07-Property-Management/Documents/" 2>/dev/null && echo "✓ addend_1.doc"

# Property Management Sample Reports
mv "$DOWNLOADS/vacanc_1.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ vacanc_1.pdf"
mv "$DOWNLOADS/rentroll.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ rentroll.pdf"
mv "$DOWNLOADS/recapr_1.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ recapr_1.pdf"
mv "$DOWNLOADS/profit_1.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ profit_1.pdf"
mv "$DOWNLOADS/openwo_1.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ openwo_1.pdf"
mv "$DOWNLOADS/fiscal_1.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ fiscal_1.pdf"
mv "$DOWNLOADS/detail_1.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ detail_1.pdf"
mv "$DOWNLOADS/cashfl_2.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ cashfl_2.pdf"
mv "$DOWNLOADS/cashfl_1.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ cashfl_1.pdf"
mv "$DOWNLOADS/budget_1.pdf" "$DEST/07-Property-Management/Sample-Reports/" 2>/dev/null && echo "✓ budget_1.pdf"

# Syndication
mv "$DOWNLOADS/the_real_estate_syndication_process.pdf" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ the_real_estate_syndication_process.pdf"
mv "$DOWNLOADS/syndication_legal_timeline.png" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ syndication_legal_timeline.png"
mv "$DOWNLOADS/questions_an_investor_should_ask_a_syndicator.pdf" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ questions_an_investor_should_ask_a_syndicator.pdf"
mv "$DOWNLOADS/nuts_and_bolts_of_a_syndication.pdf" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ nuts_and_bolts_of_a_syndication.pdf"
mv "$DOWNLOADS/investor_suitability_questionnaire_.pdf" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ investor_suitability_questionnaire_.pdf"
mv "$DOWNLOADS/how_to_structure_a_syndicate.pdf" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ how_to_structure_a_syndicate.pdf"
mv "$DOWNLOADS/how_to_structure_a_real_estate_syndicate.jpg" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ how_to_structure_a_real_estate_syndicate.jpg"
mv "$DOWNLOADS/gp_split_worksheet.xlsx" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ gp_split_worksheet.xlsx"
mv "$DOWNLOADS/fund_structure.png" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ fund_structure.png"
mv "$DOWNLOADS/example_org_chart.pdf" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ example_org_chart.pdf"
mv "$DOWNLOADS/506_b_506_c.jpg" "$DEST/08-Syndication/" 2>/dev/null && echo "✓ 506_b_506_c.jpg"

# Team, Partnering and Networking
mv "$DOWNLOADS/multif_1.pdf" "$DEST/09-Team-Partnering-Networking/" 2>/dev/null && echo "✓ multif_1.pdf"
mv "$DOWNLOADS/listof_1.doc" "$DEST/09-Team-Partnering-Networking/" 2>/dev/null && echo "✓ listof_1.doc"
mv "$DOWNLOADS/fullli_1.pdf" "$DEST/09-Team-Partnering-Networking/" 2>/dev/null && echo "✓ fullli_1.pdf"
mv "$DOWNLOADS/exampl_1.doc" "$DEST/09-Team-Partnering-Networking/" 2>/dev/null && echo "✓ exampl_1.doc"

# Virtual Assistants
mv "$DOWNLOADS/database_manager_job_ad-1.docx" "$DEST/10-Virtual-Assistants/" 2>/dev/null && echo "✓ database_manager_job_ad-1.docx"
mv "$DOWNLOADS/database_manager_agreement.docx" "$DEST/10-Virtual-Assistants/" 2>/dev/null && echo "✓ database_manager_agreement.docx"
mv "$DOWNLOADS/blank_invoice.docx" "$DEST/10-Virtual-Assistants/" 2>/dev/null && echo "✓ blank_invoice.docx"

echo ""
echo "✅ Organization complete!"
echo ""
echo "Folder structure:"
find "$DEST" -type d | head -20
