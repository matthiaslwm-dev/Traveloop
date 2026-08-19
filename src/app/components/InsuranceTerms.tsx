/**
 * Traveloop insurance Terms & Conditions, shown as the second step of the
 * registration flow (src/app/passes/register) before the buyer is sent to
 * Stripe. Static content — no props, no client JS.
 */
export default function InsuranceTerms() {
  return (
    <div className="terms-doc">
      <h3>Traveloop Insurance Terms &amp; Conditions</h3>
      <p className="terms-doc-sub">
        (Applicable to Traveloop Cultural Experiences and Participating Activities)
      </p>

      <h4>1. Acceptance</h4>
      <p>
        By participating in any Traveloop programme, activity or experience, the Participant
        confirms that they have read, understood and agreed to these Terms &amp; Conditions.
      </p>

      <h4>2. Insurance Coverage</h4>
      <p>
        Eligible Participants are protected under Traveloop&apos;s Group Personal Accident Insurance
        Policy, insured by our partner Tokio Marine Insurans (Malaysia) Berhad throughout their
        participation in registered Traveloop activities within Malaysia, subject to the
        insurer&apos;s terms, conditions, exclusions, endorsements and final approval.
      </p>
      <p>
        Insurance protection only applies to participants who have been successfully registered
        under Traveloop&apos;s monthly declaration list before the commencement of the activity.
      </p>

      <h4>3. Benefits</h4>
      <p>
        Subject to approval by the insurer, the policy provides the following maximum benefits per
        insured participant:
      </p>
      <table className="terms-table">
        <thead>
          <tr>
            <th>Benefit</th>
            <th>Maximum Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Accidental Death</td>
            <td>RM50,000</td>
          </tr>
          <tr>
            <td>Permanent Disablement</td>
            <td>RM50,000</td>
          </tr>
          <tr>
            <td>Medical Expenses (Accidental Injury)</td>
            <td>Up to RM500</td>
          </tr>
        </tbody>
      </table>
      <p>
        Actual reimbursement is subject to the policy terms and the actual medical expenses
        incurred.
      </p>

      <h4>4. Eligibility</h4>
      <p>Insurance coverage is available only to participants:</p>
      <ul>
        <li>aged between 30 days and 75 years;</li>
        <li>whose names and identification details have been declared by Traveloop;</li>
        <li>participating in officially organised Traveloop activities; and</li>
        <li>within the declared coverage period.</li>
      </ul>

      <h4>5. Geographical Scope</h4>
      <p>Insurance coverage is valid only for activities conducted within Malaysia.</p>

      <h4>6. Covered Events</h4>
      <p>Subject to the policy wording, coverage includes accidental bodily injury resulting in:</p>
      <ul>
        <li>Accidental Death</li>
        <li>Permanent Disablement</li>
        <li>Medical Expenses arising from accidental injury</li>
      </ul>
      <p>The policy may also extend to cover accidents arising from:</p>
      <ul>
        <li>Amateur sports activities</li>
        <li>Social and recreational activities</li>
        <li>Hijacking</li>
        <li>Unprovoked murder or assault</li>
        <li>Amateur scuba diving (maximum 50 metres depth)</li>
        <li>Amateur mountaineering (exclude use of rope or climbing equipment)</li>
        <li>Amateur hunting</li>
        <li>Underwater activities (maximum 50 metres depth)</li>
        <li>Electrocution</li>
        <li>Drowning</li>
        <li>Food poisoning</li>
        <li>Accidental gas inhalation</li>
        <li>Suffocation by smoke, fumes or poisonous gas</li>
        <li>Harmful insect bites / Snake bites / Animal bites (excluding diseases transmitted)</li>
        <li>
          Natural catastrophes including flood, windstorm, typhoon, hurricane and volcanic eruption
        </li>
        <li>Kidnapping (excluding terrorism-related incidents)</li>
      </ul>
      <p>Coverage is always subject to the policy terms, exclusions and insurer approval.</p>

      <h4>7. Exclusions</h4>
      <p>
        Insurance benefits may not be payable where the loss arises from circumstances excluded
        under the insurance policy, including but not limited to:
      </p>
      <ul>
        <li>Participation in professional sports or competitions.</li>
        <li>Professional scuba diving or diving beyond 50 metres.</li>
        <li>Professional mountaineering or hazardous activities not covered by the policy.</li>
        <li>Terrorism where specifically excluded.</li>
        <li>Diseases transmitted by insects, snakes or animals.</li>
        <li>Activities excluded under the insurance policy.</li>
        <li>Any event not covered under the insurer&apos;s policy wording.</li>
      </ul>
      <p>
        The insurer reserves the right to determine whether any claim falls within the policy
        coverage.
      </p>

      <h4>8. Claim Procedure</h4>
      <p>
        The Participant shall notify Traveloop as soon as reasonably practicable following an
        accident through the below methods:
      </p>
      <ul>
        <li>Email: insurance@traveloop.my</li>
        <li>WhatsApp: +6011-3949 2888</li>
        <li>WeChat: Traveloop_MY</li>
        <li>Mobile number: +6011-3949 2888</li>
      </ul>
      <p>
        Insurance claims must be submitted together with the completed Claim Form and supporting
        documents.
      </p>

      <p>
        <strong>Claims up to RM500</strong> — the following documents are required:
      </p>
      <ul>
        <li>Doctor&apos;s Diagnosis.</li>
        <li>Original Medical bill/Medical Receipt with Official Stamp and Signature.</li>
        <li>Copy of Passport or Malaysian Identity Card (NRIC).</li>
        <li>Complete e-payment form.</li>
      </ul>
      <p>Information needed for TT payment to overseas:</p>
      <ul>
        <li>Beneficiary name</li>
        <li>Beneficiary passport no</li>
        <li>Beneficiary address (overseas)</li>
        <li>Beneficiary account no</li>
        <li>Beneficiary Bank&apos;s name</li>
        <li>Beneficiary bank address</li>
        <li>Swift code (e.g. BOTKJPJT)</li>
        <li>Currency to be paid (e.g. SGD, USD etc)</li>
      </ul>

      <p>
        <strong>Permanent Disablement</strong> — the following documents are required:
      </p>
      <ul>
        <li>Copy of Passport or Malaysian Identity Card (NRIC).</li>
        <li>Specialist Report confirming the permanent disablement.</li>
        <li>Photographs depicting the amputation of the affected limb(s), where applicable.</li>
        <li>X-ray and/or MRI reports, if any.</li>
        <li>Complete e-payment form.</li>
      </ul>
      <p>Information needed for TT payment to overseas:</p>
      <ul>
        <li>Beneficiary name</li>
        <li>Beneficiary passport no</li>
        <li>Beneficiary address (overseas)</li>
        <li>Beneficiary account no</li>
        <li>Beneficiary Bank&apos;s name</li>
        <li>Beneficiary bank address</li>
        <li>Swift code (e.g. BOTKJPJT)</li>
        <li>Currency to be paid (e.g. SGD, USD etc)</li>
      </ul>

      <p>
        <strong>Accidental Death</strong> — the following documents are required:
      </p>
      <ul>
        <li>Detailed Post-Mortem Report.</li>
        <li>Toxicology Report, where applicable.</li>
        <li>Death Certificate.</li>
        <li>Police Report.</li>
        <li>Newspaper cutting of the incident, where applicable.</li>
        <li>Burial or Cremation Permit.</li>
        <li>Copy of Deceased&apos;s Passport or Malaysian Identity Card (NRIC).</li>
        <li>Copy of Marriage/Birth Certificate, where applicable.</li>
        <li>
          Letter of Administration/Distribution Order/Sijil Faraid — when there is no Nomination.
        </li>
        <li>Complete e-payment form.</li>
      </ul>
      <p>Information needed for TT payment to overseas:</p>
      <ul>
        <li>Beneficiary name</li>
        <li>Beneficiary passport no</li>
        <li>Beneficiary address (overseas)</li>
        <li>Beneficiary account no</li>
        <li>Beneficiary Bank&apos;s name</li>
        <li>Beneficiary bank address</li>
        <li>Swift code (e.g. BOTKJPJT)</li>
        <li>Currency to be paid (e.g. SGD, USD etc)</li>
      </ul>

      <p>Traveloop may request additional documents if required by the insurer.</p>

      <h4>9. Claim Notification</h4>
      <p>Claims should be reported to Traveloop via the below methods as soon as possible.</p>
      <ul>
        <li>Email: insurance@traveloop.my</li>
        <li>WhatsApp: +6011-3949 2888</li>
        <li>WeChat: Traveloop_MY</li>
        <li>Mobile number: +6011-3949 2888</li>
      </ul>
      <p>
        Where applicable under the insurance policy, notification should be made within 5 days from
        the date of the accident. Late notification may affect claim assessment by the insurer.
      </p>

      <h4>10. Claim Assessment</h4>
      <ul>
        <li>Submission of a claim does not guarantee payment.</li>
        <li>All claims shall be assessed solely by the insurer in accordance with the policy.</li>
        <li>The insurer reserves the right to approve, reject or reduce any claim.</li>
        <li>Traveloop has no authority to approve or reject insurance claims.</li>
      </ul>

      <h4>11. Limitation of Liability</h4>
      <p>
        Traveloop (Seni Mega Venture Sdn. Bhd.) acts solely as the programme organiser and
        policyholder.
      </p>
      <p>
        Traveloop shall not be liable for any injury, illness, death, loss or damage suffered by any
        participant beyond the benefits payable under the applicable insurance policy or where a
        claim is rejected by the insurer.
      </p>
      <p>
        Traveloop shall not be responsible for any decision made by the insurer regarding claim
        approval, benefit amount or claim settlement.
      </p>

      <h4>12. Participant Responsibilities</h4>
      <p>Participants shall:</p>
      <ul>
        <li>provide true and accurate information;</li>
        <li>comply with all safety instructions;</li>
        <li>exercise reasonable care during activities;</li>
        <li>immediately seek medical treatment following an accident where necessary;</li>
        <li>retain all original medical documents and receipts;</li>
        <li>cooperate fully with Traveloop and the insurer during claim investigations.</li>
      </ul>
      <p>Failure to comply may result in claim rejection.</p>

      <h4>13. Fraudulent Claims</h4>
      <p>
        Any false declaration, forged document, fraudulent claim or material misrepresentation may
        result in immediate rejection of the claim and cancellation of any entitlement under the
        insurance policy.
      </p>

      <h4>14. Force Majeure</h4>
      <p>
        Traveloop shall not be liable for cancellation, postponement or interruption of activities
        arising from circumstances beyond its reasonable control, including adverse weather,
        government restrictions, natural disasters, strikes or other force majeure events.
      </p>

      <h4>15. Sanctions</h4>
      <p>
        No insurance benefit shall be payable where payment would expose the insurer to any
        sanction, prohibition or restriction imposed under applicable United Nations, United States,
        United Kingdom, European Union or other applicable laws.
      </p>

      <h4>16. Governing Law</h4>
      <p>
        These Terms &amp; Conditions shall be governed by the laws of Malaysia. Any dispute shall be
        subject to the exclusive jurisdiction of the Courts of Malaysia.
      </p>

      <h4>17. Insurance Claim</h4>
      <p>
        Traveloop acts solely as a coordinator to assist and monitor the insurance claim process.
        All claims shall be assessed and processed directly by Tokio Marine Insurance (Malaysia)
        Berhad in accordance with the insurance policy terms and conditions.
      </p>
      <p>
        Any approved claim payment shall be made directly by Tokio Marine Insurance (Malaysia)
        Berhad to the eligible injured person or claimant in Ringgit Malaysia (MYR). In the event
        that the insured person has returned to their country of residence, Tokio Marine Insurance
        (Malaysia) Berhad may arrange the payment in the applicable foreign currency, subject to
        Tokio Marine&apos;s approval, applicable exchange rate determination and internal
        procedures. Any currency conversion shall be handled solely by Tokio Marine Insurance
        (Malaysia) Berhad.
      </p>
      <p>
        Traveloop shall not be responsible for the assessment, approval, rejection, currency
        exchange rate, currency conversion, processing or payment of any insurance claim.
      </p>

      <h4>Participant Declaration</h4>
      <p>
        ☐ I hereby confirm that I have read, understood and agreed to the Traveloop Terms &amp;
        Conditions and Insurance Terms &amp; Conditions. I acknowledge that participation is
        voluntary and at my own risk. I understand that insurance coverage is subject to the
        insurer&apos;s policy terms, conditions, exclusions and final approval, and that Traveloop
        (Seni Mega Venture Sdn. Bhd.) shall not be liable for any claim rejected or reduced by the
        insurer.
      </p>
    </div>
  );
}
