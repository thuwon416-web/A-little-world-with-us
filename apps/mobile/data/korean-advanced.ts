  { id: 'kr-l4-health-learning', level: 4, title: 'Health, Learning, and Problems', titleMy: 'ကျန်းမာရေး၊ သင်ယူမှုနှင့် ပြဿနာများ', description: 'Talk about habits, learning goals, everyday problems, and practical solutions.', order: 23, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l5-work-technology', level: 5, title: 'Work, Technology, and Society', titleMy: 'အလုပ်၊ နည်းပညာနှင့် လူမှုအဖွဲ့အစည်း', description: 'Discuss professional life, technology, information, and changes in society.', order: 24, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l6-society-and-choice', level: 6, title: 'Society, Values, and Choices', titleMy: 'လူမှုအဖွဲ့အစည်း၊ တန်ဖိုးများနှင့် ရွေးချယ်မှုများ', description: 'Express viewpoints about society, values, choices, impact, and shared life.', order: 25, createdAt: CREATED_AT, updatedAt: CREATED_AT },
// Keep synchronized with src/data/korean-advanced.ts.
// Keep synchronized with src/data/korean-advanced.ts.\nimport type { KoreanLesson, KoreanVocab } from '@/types/korean'

const CREATED_AT = '2026-10-07T00:00:00Z'

export const KOREAN_ADVANCED_LESSONS: KoreanLesson[] = [
  { id: 'kr-l4-sentence-links', level: 4, title: 'Longer Sentences', titleMy: 'ဝါကျရှည်များ တည်ဆောက်ခြင်း', description: 'Connect ideas with contrast, reasons, sequence, and simple explanations.', order: 14, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l4-experience-plans', level: 4, title: 'Experience and Plans', titleMy: 'အတွေ့အကြုံနှင့် အစီအစဉ်များ', description: 'Talk about past experiences, future plans, intentions, and hopes.', order: 15, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l4-polite-conversation', level: 4, title: 'Polite Conversation', titleMy: 'ယဉ်ကျေးသော စကားပြောပုံ', description: 'Handle requests, suggestions, opinions, and everyday social situations naturally.', order: 16, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l5-honorifics', level: 5, title: 'Respectful Korean', titleMy: 'ရိုသေလေးစားစွာ ပြောဆိုခြင်း', description: 'Use honorific vocabulary and respectful sentence patterns in social contexts.', order: 17, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l5-conditions', level: 5, title: 'Conditions and Choices', titleMy: 'အခြေအနေများနှင့် ရွေးချယ်မှုများ', description: 'Express conditions, alternatives, advice, warnings, and consequences.', order: 18, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l5-indirect-speech', level: 5, title: 'Reported Speech', titleMy: 'ပြန်လည်ပြောပြခြင်း', description: 'Report what someone said, asked, heard, or requested with clear context.', order: 19, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l6-nuance', level: 6, title: 'Nuance and Tone', titleMy: 'အဓိပ္ပာယ်ကွဲပြားမှုနှင့် အသံနေအသံထား', description: 'Distinguish casual, neutral, formal, and emotionally nuanced expressions.', order: 20, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l6-discussion', level: 6, title: 'Discussion and Reasoning', titleMy: 'ဆွေးနွေးခြင်းနှင့် အကြောင်းပြချက်ပေးခြင်း', description: 'Give opinions, compare ideas, support claims, and respond thoughtfully.', order: 21, createdAt: CREATED_AT, updatedAt: CREATED_AT },
  { id: 'kr-l6-real-world-korean', level: 6, title: 'Real-World Korean', titleMy: 'လက်တွေ့ဘဝ ကိုရီးယားစကား', description: 'Read notices, understand common workplace language, and communicate with confidence.', order: 22, createdAt: CREATED_AT, updatedAt: CREATED_AT },
]

const makeVocab = (
  id: string, lessonId: string, korean: string, romanization: string, english: string, myanmar: string,
  exampleSentence: string, exampleTranslation: string, tags: string[],
): KoreanVocab => ({
  id, lessonId, korean, romanization, english, myanmar, audioUrl: null, exampleSentence,
  exampleTranslation, level: Number(lessonId.slice(4, 5)) as KoreanVocab['level'], tags, createdAt: CREATED_AT,
})

type Seed = [string, string, string, string, string, string, string, string, string[]]

const SEEDS: Seed[] = [
  ['kr-l4-contrast','kr-l4-sentence-links','하지만','hajiman','but / however','ဒါပေမယ့်','가고 싶지만 오늘은 시간이 없어요.','သွားချင်ပေမယ့် ဒီနေ့အချိန်မရှိဘူး။',['grammar','contrast']],
  ['kr-l4-reason','kr-l4-sentence-links','그래서','geuraeseo','so / therefore','ဒါကြောင့်','비가 와요. 그래서 집에 있어요.','မိုးရွာတယ်။ ဒါကြောင့် အိမ်မှာနေတယ်။',['grammar','reason']],
  ['kr-l4-because','kr-l4-sentence-links','때문에','ttaemune','because of','ကြောင့်','교통 때문에 늦었어요.','ယာဉ်ကြောကြောင့် နောက်ကျသွားတယ်။',['grammar','reason']],
  ['kr-l4-before','kr-l4-sentence-links','전에','jeone','before','မတိုင်မီ','자기 전에 책을 읽어요.','မအိပ်ခင် စာအုပ်ဖတ်တယ်။',['grammar','time']],
  ['kr-l4-after','kr-l4-sentence-links','후에','hue','after','ပြီးနောက်','수업 후에 만나요.','စာသင်ပြီးနောက် တွေ့မယ်။',['grammar','time']],
  ['kr-l4-while','kr-l4-sentence-links','동안','dongan','during / while','အတွင်း','여행하는 동안 사진을 많이 찍었어요.','ခရီးသွားနေစဉ် ဓာတ်ပုံအများကြီးရိုက်ခဲ့တယ်။',['grammar','time']],
  ['kr-l4-want','kr-l4-experience-plans','고 싶다','go sipda','want to','ချင်သည်','한국에 가고 싶어요.','ကိုရီးယားကို သွားချင်တယ်။',['grammar','intention']],
  ['kr-l4-plan','kr-l4-experience-plans','려고 하다','ryeogo hada','intend to / plan to','လုပ်ဖို့ ရည်ရွယ်သည်','주말에 영화를 보려고 해요.','အပတ်ကုန်မှာ ရုပ်ရှင်ကြည့်ဖို့ ရည်ရွယ်ထားတယ်။',['grammar','plan']],
  ['kr-l4-experience','kr-l4-experience-plans','아/어 본 적이 있다','a/eobon jeogi itda','have experienced','လုပ်ဖူးသည်','한국 음식을 먹어 본 적이 있어요.','ကိုရီးယားအစားအစာ စားဖူးတယ်။',['grammar','experience']],
  ['kr-l4-hope','kr-l4-experience-plans','으면 좋겠다','eumyeon joketda','I hope / it would be nice if','ဖြစ်ရင်ကောင်းမယ်','내일 날씨가 좋으면 좋겠어요.','မနက်ဖြန် ရာသီဥတုကောင်းရင် ကောင်းမယ်။',['grammar','hope']],
  ['kr-l4-suggest','kr-l4-polite-conversation','을까요?','eulkkayo','shall we? / would you like?','လုပ်မလား','같이 갈까요?','အတူတူ သွားမလား။',['grammar','suggestion']],
  ['kr-l4-request','kr-l4-polite-conversation','아/어 주세요','a/eo juseyo','please do','လုပ်ပေးပါ','천천히 말해 주세요.','ဖြည်းဖြည်းပြောပေးပါ။',['grammar','request']],

  ['kr-l5-honorific-eat','kr-l5-honorifics','드시다','deusida','to eat/drink (honorific)','စား/သောက်သည် (ရိုသေစကား)','할머니께서 식사를 드세요.','အဘွားက ထမင်းစားနေပါတယ်။',['honorific','verb']],
  ['kr-l5-honorific-sleep','kr-l5-honorifics','주무시다','jumusida','to sleep (honorific)','အိပ်သည် (ရိုသေစကား)','아버지는 지금 주무세요.','အဖေ အခုအိပ်နေပါတယ်။',['honorific','verb']],
  ['kr-l5-honorific-be','kr-l5-honorifics','계시다','gyesida','to be / stay (honorific)','ရှိနေသည် (ရိုသေစကား)','선생님은 교실에 계세요.','ဆရာက စာသင်ခန်းမှာရှိပါတယ်။',['honorific','verb']],
  ['kr-l5-honorific-give','kr-l5-honorifics','드리다','deurida','to give (humble)','ပေးသည် (နှိမ့်ချစကား)','제가 선생님께 드릴게요.','ကျွန်တော် ဆရာ့ကို ပေးပါမယ်။',['honorific','verb']],
  ['kr-l5-condition-if','kr-l5-conditions','으면','eumyeon','if / when','ရင် / လျှင်','시간이 있으면 같이 가요.','အချိန်ရှိရင် အတူတူသွားမယ်။',['grammar','condition']],
  ['kr-l5-unless','kr-l5-conditions','지 않으면','ji aneumyeon','unless / if not','မ...ရင်','서두르지 않으면 늦어요.','အလျင်မလုပ်ရင် နောက်ကျမယ်။',['grammar','condition']],
  ['kr-l5-should','kr-l5-conditions','는 게 좋다','neun ge jota','it is better to','လုပ်တာကောင်းတယ်','건강을 위해 운동하는 게 좋아요.','ကျန်းမာရေးအတွက် လေ့ကျင့်ခန်းလုပ်တာကောင်းတယ်။',['grammar','advice']],
  ['kr-l5-must','kr-l5-conditions','아/어야 하다','a/eoya hada','must / have to','ရမည်','오늘 숙제를 해야 해요.','ဒီနေ့ အိမ်စာလုပ်ရမယ်။',['grammar','obligation']],
  ['kr-l5-said','kr-l5-indirect-speech','다고 하다','dago hada','say that','ဟု ပြောသည်','친구가 내일 온다고 했어요.','သူငယ်ချင်းက မနက်ဖြန်လာမယ်လို့ ပြောတယ်။',['grammar','reported-speech']],
  ['kr-l5-asked','kr-l5-indirect-speech','냐고 묻다','nyago mutda','ask whether / ask if','ဟုတ်မဟုတ် မေးသည်','친구가 어디 가냐고 물었어요.','သူငယ်ချင်းက ဘယ်သွားမလဲလို့ မေးတယ်။',['grammar','reported-speech']],
  ['kr-l5-requested','kr-l5-indirect-speech','라고 하다','rago hada','tell someone to','လုပ်ရန် ပြောသည်','선생님이 책을 읽으라고 했어요.','ဆရာက စာအုပ်ဖတ်ဖို့ ပြောတယ်။',['grammar','reported-speech']],
  ['kr-l5-heard','kr-l5-indirect-speech','다고 들었다','dago deureotda','heard that','ကြားရသည်','내일 비가 온다고 들었어요.','မနက်ဖြန် မိုးရွာမယ်လို့ ကြားတယ်။',['grammar','reported-speech']],

  ['kr-l6-apparently','kr-l6-nuance','나 보다','na boda','it seems / apparently','ထင်ရသည်','오늘은 사람이 많은가 봐요.','ဒီနေ့ လူများမယ့်ပုံပဲ။',['grammar','inference']],
  ['kr-l6-seems','kr-l6-nuance','는 것 같다','neun geot gatda','seems like','...ပုံရသည်','그 사람이 학생인 것 같아요.','အဲဒီလူက ကျောင်းသားဖြစ်ပုံရတယ်။',['grammar','nuance']],
  ['kr-l6-although','kr-l6-nuance','더라도','deorado','even if / even though','...ဖြစ်သော်လည်း','힘들더라도 끝까지 해 봐요.','ခက်ခဲရင်တောင် အဆုံးထိလုပ်ကြည့်မယ်။',['grammar','contrast']],
  ['kr-l6-rather','kr-l6-nuance','차라리','charari','rather / instead','အစား / တစ်ဖက်က','차라리 집에서 쉬는 게 어때요?','အိမ်မှာပဲ နားတာက ပိုကောင်းမလား။',['expression','choice']],
  ['kr-l6-instead','kr-l6-nuance','대신에','daesine','instead of / in place of','အစား','커피 대신에 차를 마셨어요.','ကော်ဖီအစား လက်ဖက်ရည်သောက်ခဲ့တယ်။',['expression','choice']],
  ['kr-l6-according','kr-l6-discussion','에 따르면','e ttareumyeon','according to','အရ / အတိုင်း','조사에 따르면 사람들이 더 일찍 자요.','စစ်တမ်းအရ လူတွေ စောစောအိပ်လာကြတယ်။',['discussion','source']],
  ['kr-l6-opinion','kr-l6-discussion','개인적으로','gaeinjeogeuro','personally','ကိုယ်ပိုင်အမြင်အရ','개인적으로 이 방법이 더 좋아요.','ကိုယ်ပိုင်အမြင်အရ ဒီနည်းလမ်းက ပိုကောင်းတယ်။',['discussion','opinion']],
  ['kr-l6-evidence','kr-l6-discussion','근거','geungeo','evidence / basis','အထောက်အထား / အခြေခံအကြောင်းပြချက်','그 주장을 뒷받침할 근거가 필요해요.','အဲဒီအဆိုကို ထောက်ခံပေးမယ့် အထောက်အထားလိုတယ်။',['discussion','academic']],
  ['kr-l6-compare','kr-l6-discussion','반면에','banmyeone','on the other hand','တစ်ဖက်မှာတော့','이 제품은 가격이 저렴한 반면에 품질이 좋아요.','ဒီပစ္စည်းက ဈေးသက်သာတဲ့အပြင် အရည်အသွေးလည်းကောင်းတယ်။',['discussion','contrast']],
  ['kr-l4-health','kr-l4-health-learning','건강','geongang','health','ကျန်းမာရေး','건강을 위해 매일 운동해요.','ကျန်းမာရေးအတွက် နေ့တိုင်း လေ့ကျင့်ခန်းလုပ်တယ်။',['health','daily-life']],
  ['kr-l4-habit','kr-l4-health-learning','습관','seupgwan','habit','အလေ့အကျင့်','좋은 습관을 만들고 싶어요.','ကောင်းတဲ့အလေ့အကျင့်တစ်ခု ဖန်တီးချင်တယ်။',['health','habit']],
  ['kr-l4-familiar','kr-l4-health-learning','익숙하다','iksukhada','to be familiar / accustomed','အကျွမ်းဝင်သည်','이제 한국 생활에 익숙해졌어요.','အခု ကိုရီးယားမှာ နေထိုင်ရတာ အကျွမ်းဝင်လာပြီ။',['adaptation','daily-life']],
  ['kr-l4-goal','kr-l4-health-learning','목표','mokpyo','goal','ရည်မှန်းချက်','이번 달 목표를 정했어요.','ဒီလအတွက် ရည်မှန်းချက် သတ်မှတ်လိုက်တယ်။',['learning','goal']],
  ['kr-l4-practice','kr-l4-health-learning','연습하다','yeonseuphada','to practice','လေ့ကျင့်သည်','매일 한국어를 연습해요.','နေ့တိုင်း ကိုရီးယားစကား လေ့ကျင့်တယ်။',['learning','practice']],
  ['kr-l4-explain','kr-l4-health-learning','설명하다','seolmyeonghada','to explain','ရှင်းပြသည်','문제를 쉽게 설명해 주세요.','ပြဿနာကို လွယ်လွယ်ရှင်းပြပေးပါ။',['communication','problem-solving']],
  ['kr-l4-problem','kr-l4-health-learning','문제','munje','problem','ပြဿနာ','문제가 생기면 바로 알려 주세요.','ပြဿနာဖြစ်ရင် ချက်ချင်းပြောပေးပါ။',['problem-solving','daily-life']],
  ['kr-l4-solution','kr-l4-health-learning','해결하다','haegyeolhada','to solve / resolve','ဖြေရှင်းသည်','같이 문제를 해결해 봐요.','အတူတူ ပြဿနာကို ဖြေရှင်းကြည့်ရအောင်။',['problem-solving','communication']],

  ['kr-l5-job','kr-l5-work-technology','직업','jigeop','occupation / profession','အလုပ်အကိုင်','어떤 직업을 선택하고 싶어요?','ဘယ်လိုအလုပ်အကိုင်မျိုးကို ရွေးချင်လဲ။',['work','career']],
  ['kr-l5-workplace','kr-l5-work-technology','직장','jikjang','workplace','အလုပ်ခွင်','직장에서 새로운 일을 맡았어요.','အလုပ်ခွင်မှာ အလုပ်အသစ်တစ်ခု တာဝန်ယူလိုက်တယ်။',['work','professional']],
  ['kr-l5-meeting','kr-l5-work-technology','회의','hoeui','meeting','အစည်းအဝေး','오후에 중요한 회의가 있어요.','နေ့လယ်ပိုင်းမှာ အရေးကြီးတဲ့ အစည်းအဝေးရှိတယ်။',['work','professional']],
  ['kr-l5-task','kr-l5-work-technology','업무','eopmu','work duties / tasks','အလုပ်တာဝန်','오늘 업무가 많아요.','ဒီနေ့ အလုပ်တာဝန်တွေ များတယ်။',['work','professional']],
  ['kr-l5-technology','kr-l5-work-technology','기술','gisul','technology / skill','နည်းပညာ / ကျွမ်းကျင်မှု','새로운 기술을 배우고 있어요.','နည်းပညာအသစ်တစ်ခု သင်ယူနေတယ်။',['technology','learning']],
  ['kr-l5-information','kr-l5-work-technology','정보','jeongbo','information','သတင်းအချက်အလက်','정확한 정보가 필요해요.','တိကျတဲ့ သတင်းအချက်အလက် လိုတယ်။',['information','society']],
  ['kr-l5-economy','kr-l5-work-technology','경제','gyeongje','economy','စီးပွားရေး','경제에 관심이 많아요.','စီးပွားရေးကို စိတ်ဝင်စားတယ်။',['society','economy']],
  ['kr-l5-consumption','kr-l5-work-technology','소비','sobi','consumption','သုံးစွဲမှု','필요한 만큼만 소비하려고 해요.','လိုအပ်သလောက်ပဲ သုံးစွဲဖို့ ကြိုးစားတယ်။',['economy','daily-life']],

  ['kr-l6-society','kr-l6-society-and-choice','사회','sahoe','society','လူမှုအဖွဲ့အစည်း','우리 사회에는 다양한 사람들이 살아요.','ကျွန်တော်တို့ လူမှုအဖွဲ့အစည်းမှာ လူအမျိုးမျိုး နေထိုင်ကြတယ်။',['society','discussion']],
  ['kr-l6-value','kr-l6-society-and-choice','가치','gachi','value','တန်ဖိုး','서로 다른 가치를 존중해야 해요.','တစ်ယောက်နဲ့တစ်ယောက် မတူညီတဲ့ တန်ဖိုးတွေကို လေးစားရမယ်။',['society','values']],
  ['kr-l6-coexist','kr-l6-society-and-choice','공존','gongjon','coexistence','အတူယှဉ်တွဲနေထိုင်မှု','서로 이해하며 공존하는 방법을 생각해 봐요.','တစ်ယောက်နဲ့တစ်ယောက် နားလည်ပြီး အတူယှဉ်တွဲနေထိုင်ဖို့ နည်းလမ်းစဉ်းစားကြည့်ရအောင်။',['society','values']],
  ['kr-l6-choice','kr-l6-society-and-choice','선택','seontaek','choice / selection','ရွေးချယ်မှု','중요한 선택일수록 신중해야 해요.','အရေးကြီးတဲ့ ရွေးချယ်မှုဆို ပိုပြီး သေချာစဉ်းစားရမယ်။',['discussion','choice']],
  ['kr-l6-impact','kr-l6-society-and-choice','영향','yeonghyang','influence / impact','သက်ရောက်မှု','그 결정은 많은 사람에게 영향을 줬어요.','အဲဒီဆုံးဖြတ်ချက်က လူအများအပေါ် သက်ရောက်မှုရှိခဲ့တယ်။',['discussion','impact']],
  ['kr-l6-perspective','kr-l6-society-and-choice','관점','gwanjeom','perspective / point of view','ရှုမြင်ချက်','다른 관점에서 생각해 볼 필요가 있어요.','အခြားရှုမြင်ချက်ကနေ စဉ်းစားကြည့်ဖို့ လိုတယ်။',['discussion','opinion']],
  ['kr-l6-success','kr-l6-society-and-choice','성공','seonggong','success','အောင်မြင်မှု','성공의 기준은 사람마다 달라요.','အောင်မြင်မှုရဲ့ သတ်မှတ်ချက်က လူတစ်ယောက်နဲ့တစ်ယောက် မတူဘူး။',['society','values']],
  ['kr-l6-exercise','kr-l6-society-and-choice','운동','undong','exercise / sport','လေ့ကျင့်ခန်း / အားကစား','건강을 위해 꾸준히 운동하고 있어요.','ကျန်းမာရေးအတွက် ပုံမှန်လေ့ကျင့်ခန်းလုပ်နေတယ်။',['health','lifestyle']],
  ['kr-l6-notice','kr-l6-real-world-korean','주의','jui','caution / attention','သတိ','안전사고에 주의하세요.','လုံခြုံရေးမတော်တဆမှုကို သတိထားပါ။',['real-world','notice']],
  ['kr-l6-prohibited','kr-l6-real-world-korean','금지','geumji','prohibited / prohibition','တားမြစ်ချက်','주차 금지입니다.','ကားရပ်နားခြင်း တားမြစ်ထားပါတယ်။',['real-world','notice']],
  ['kr-l6-available','kr-l6-real-world-korean','이용 가능','iyong ganeung','available for use','အသုံးပြုနိုင်သည်','이 시설은 누구나 이용 가능해요.','ဒီအဆောက်အအုံကို ဘယ်သူမဆို အသုံးပြုနိုင်တယ်။',['real-world','notice']],
]

export const KOREAN_ADVANCED_VOCAB = SEEDS.map(([id, lessonId, korean, romanization, english, myanmar, exampleSentence, exampleTranslation, tags]) =>
  makeVocab(id, lessonId, korean, romanization, english, myanmar, exampleSentence, exampleTranslation, tags)
)
