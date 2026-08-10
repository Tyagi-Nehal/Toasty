// Blank starting shape for a new MOM submission. Singular roles are each
// a { name, comments } pair (name prefilled from the real meeting's role
// assignments when the Secretary opens the page — still fully editable).
// Speakers/Evaluators/Table Topic speakers are dynamic lists — add/remove
// as many as the meeting actually had, since the count varies every time.

export function blankMOM() {
  return {
    location: '',
    startTime: '',
    endTime: '',
    saa: { name: '', comments: '' },
    presidingOfficer: { name: '', comments: '' },
    tmod: { name: '', comments: '' },
    ge: { name: '', comments: '' },
    geOverallComments: '',
    speakers: [],
    evaluators: [],
    ttMaster: { name: '', comments: '' },
    ttSpeakers: [],
    timer: { name: '', comments: '' },
    ahCounter: { name: '', comments: '' },
    grammarian: { name: '', comments: '' },
    listener: { name: '', comments: '' },
    awardsGiven: '',
    actionItems: '',
  }
}
