'use client'

import { useState } from 'react'
import { Calendar, Heart, Activity, DollarSign, TrendingUp, Briefcase } from 'lucide-react'

interface ForecastData {
  career: string
  careerMy: string
  careerAdvice: string
  careerAdviceMy: string
  love: string
  loveMy: string
  loveAdvice: string
  loveAdviceMy: string
  health: string
  healthMy: string
  healthAdvice: string
  healthAdviceMy: string
  money: string
  moneyMy: string
  moneyAdvice: string
  moneyAdviceMy: string
}

const monthlyForecasts: Record<string, ForecastData> = {
  January: {
    career: 'Strong career momentum. Professional opportunities arise mid-month.',
    careerMy: 'အလုပ်ဖွံ့ဖြိုးမှုမြင့်မားပါ။ လအလယ်တွင် အခွင့်အလမ်းရှိပါ။',
    careerAdvice: 'Focus on networking and building professional relationships.',
    careerAdviceMy: 'ဆက်သွယ်ရေးနှင့် အလုပ်ဆက်ဆံရေးကို အဓိကထားပါ။',
    love: 'Romance flourishes. New connections or deepening bonds.',
    loveMy: 'ချစ်စရာစိတ်ဖွံ့ဖြိုးပါ။ ဆက်ဆံရေးအသစ် သို့ နက်ရှိုင်းသောဆက်ဆံရေး။',
    loveAdvice: 'Be open to new romantic possibilities.',
    loveAdviceMy: 'ချစ်စရာစိတ်အသစ်တွေကို လက်ခံပါ။',
    health: 'Good energy for fitness goals. Start new exercise routines.',
    healthMy: 'ကျန်းမာရေးရည်မှန်းချက်အတွက် စွမ်းအင်ကောင်းပါ။ လေ့ကျင့်ခန်းအသစ်စတင်ပါ။',
    healthAdvice: 'Prioritize sleep and hydration for optimal wellness.',
    healthAdviceMy: 'အိပ်ရေးနှင့် ရေသောက်ရေးကို အဓိကထားပါ။',
    money: 'Financial planning pays off. Budget wisely.',
    moneyMy: 'ငွေကြေးစီမံကိန်းက အကျိုးပြုပါ။ ဘတ်ဂျက်ကို ကျစ်လျစ်စွာထားပါ။',
    moneyAdvice: 'Avoid impulsive purchases. Save for major goals.',
    moneyAdviceMy: 'အမြန်ဝယ်ယူမှုကို ရှောင်ပါ။ ရည်မှန်းချက်အတွက် သိမ်းဆည်းပါ။',
  },
  February: {
    career: 'Collaborative projects succeed. Teamwork brings recognition.',
    careerMy: 'ပူးပေါင်းဆောင်ရွက်မှုအောင်မြင်ပါ။ အဖွဲ့လုပ်ငန်းက ချီးမြှောက်မှုရပါ။',
    careerAdvice: 'Share credit with colleagues. Build trust.',
    careerAdviceMy: 'လက်တွေ့များနှင့် အတူပိုင်ဆိုင်ပါ။ ယုံကြည်မှုတည်ဆောက်ပါ။',
    love: 'Deep emotional connections. Vulnerability strengthens bonds.',
    loveMy: 'စိတ်ခံစားမှုနက်ရှိုင်းပါ။ ဖော်ပြမှုက ဆက်ဆံရေးကို ခိုင်မားစေပါ။',
    loveAdvice: 'Express feelings openly and honestly.',
    loveAdviceMy: 'စိတ်ခံစားချက်ကို ဖော်ပြပါ။',
    health: 'Focus on mental wellness. Stress management is key.',
    healthMy: 'စိတ်ကျန်းမာရေးကို အဓိကထားပါ။ စိတ်ဖိစီးမှုကို စီမံပါ။',
    healthAdvice: 'Practice meditation or mindfulness exercises.',
    healthAdviceMy: 'ကြိုးစားခန်း သို့ စိတ်ကျေနပ်ရေးလေ့ကျင့်ခန်းလုပ်ပါ။',
    money: 'Unexpected expenses possible. Build emergency fund.',
    moneyMy: 'မျှော်လင့်ချက်မရှိသောကုန်ကျစရိတ်ဖြစ်နိုင်ပါ။ အရေးပေါ်ရန်ပုံငွေစုပါ။',
    moneyAdvice: 'Review and adjust your budget monthly.',
    moneyAdviceMy: 'ဘတ်ဂျက်ကို လစဉ်စစ်ဆေးပါ။',
  },
  March: {
    career: 'Innovation opportunities. Think creatively about solutions.',
    careerMy: 'တီထွင်မှုအခွင့်အလမ်းရှိပါ။ ဖန်တီးမှုတွေးခေါ်ပါ။',
    careerAdvice: 'Propose new ideas. Take calculated risks.',
    careerAdviceMy: 'အတွေးအသစ်တွေကို တင်ပြပါ။ တွက်ချက်ထားသောအန္တရာယ်တွေယူပါ။',
    love: 'Spring romance energy. Exciting new possibilities.',
    loveMy: 'နွေဦးချစ်စရာစိတ်ပြည့်နေပါ။ စိတ်လှုပ်ရှားမှုအသစ်တွေ။',
    loveAdvice: 'Be adventurous in love. Try new experiences together.',
    loveAdviceMy: 'ချစ်စရာစိတ်တွင် စွန့်စားပါ။ အတွေ့အကြုံအသစ်တွေကို စမ်းကြည့်ပါ။',
    health: 'Renewal and growth. Start fresh health habits.',
    healthMy: 'ပြန်လည်မွေးဖွားမှုနှင့် ဖွံ့ဖြိုးမှု။ ကျန်းမာရေးအလေ့အကျင့်အသစ်စတင်ပါ။',
    healthAdvice: 'Spring clean your lifestyle. Remove unhealthy habits.',
    healthAdviceMy: 'ဘဝပုံစံကို သန့်ရှင်းပါ။ မကောင်းတဲ့အလေ့အကျင့်တွေဖယ်ရှားပါ။',
    money: 'Investment opportunities appear. Research thoroughly.',
    moneyMy: 'ရင်းနှီးမြှုပ်နှံမှုအခွင့်အလမ်းပေါ်ပါ။ ကျယ်ကျယ်ပြန့်ပြန့်လေ့လာပါ။',
    moneyAdvice: 'Diversify your portfolio. Don&apos;t put all eggs in one basket.',
    moneyAdviceMy: 'ရင်းနှီးမြှုပ်နှံမှုကို ကွဲပြားစေပါ။ တစ်ခုတည်းမှာထားမနေပါ။',
  },
  April: {
    career: 'Focus and determination. Career advancement possible.',
    careerMy: 'အာရုံစိုက်မှုနှင့် ဆုံးဖြတ်ချက်။ အလုပ်ဖွံ့ဖြိုးမှုဖြစ်နိုင်ပါ။',
    careerAdvice: 'Stay focused on goals. Avoid distractions.',
    careerAdviceMy: 'ရည်မှန်းချက်တွေကို အာရုံစိုက်ပါ။ အနှောင့်အယှက်တွေရှောင်ပါ။',
    love: 'Stability and commitment. Relationships deepen.',
    loveMy: 'မြဲမြံမှုနှင့် ကတိစောင့်ထိန်းမှု။ ဆက်ဆံရေးနက်ရှိုင်းပါ။',
    loveAdvice: 'Build trust through consistency and reliability.',
    loveAdviceMy: 'တည်မြဲမှုနှင့် ယုံကြည်စိတ်ချိုလိုက်မှုတို့ဖြင့် ယုံကြည်မှုတည်ဆောက်ပါ။',
    health: 'Balance is essential. Work-life harmony matters.',
    healthMy: 'မျှတမှုအရေးကြီးပါ။ အလုပ်နှင့် ဘဝညီညွတ်မှုအရေးကြီးပါ။',
    healthAdvice: 'Find balance between work and personal life.',
    healthAdviceMy: 'အလုပ်နှင့် ကိုယ်ပိုင်ဘဝကြား မျှတမှုရှာပါ။',
    money: 'Steady income growth. Good time for savings.',
    moneyMy: 'ဝင်ငွေတိုးတက်မှုမြဲမြံပါ။ သိမ်းဆည်းရန်အချိန်ကောင်းပါ။',
    moneyAdvice: 'Automate savings. Pay yourself first.',
    moneyAdviceMy: 'သိမ်းဆည်းမှုကို အလိုအလျောက်လုပ်ပါ။ ကိုယ့်ကိုယ်ကို ဦးစားပေးပါ။',
  },
  May: {
    career: 'Networking brings opportunities. Expand professional circle.',
    careerMy: 'ဆက်သွယ်ရေးမှ အခွင့်အလမ်းရှိပါ။ အလုပ်ဆက်ဆံရေးကို ချဲ့ထွင်ပါ။',
    careerAdvice: 'Attend industry events. Make meaningful connections.',
    careerAdviceMy: 'စက်မှုလုပ်ငန်းပွဲတွေတက်ပါ။ အဓိပ္ပါယ်ရှိသောဆက်ဆံရေးတွေဖန်တီးပါ။',
    love: 'Communication improves. Honest conversations strengthen bonds.',
    loveMy: 'ဆက်သွယ်ရေးတိုးတက်ပါ။ တိကျသောစကားပြောဆိုမှုတွေက ဆက်ဆံရေးကို ခိုင်မားစေပါ။',
    loveAdvice: 'Listen actively to your partner&apos;s needs.',
    loveAdviceMy: 'မိတ်ဖက်လိုအပ်ချက်တွေကို နားထောင်ပါ။',
    health: 'Energy levels high. Great time for outdoor activities.',
    healthMy: 'စွမ်းအင်မြင့်မားပါ။ ပြင်ပလှုပ်ရှားမှုတွေအတွက် အချိန်ကောင်းပါ။',
    healthAdvice: 'Take advantage of good weather. Exercise outdoors.',
    healthAdviceMy: 'ရာသီဥတုကောင်းကို အသုံးချပါ။ ပြင်ပလေ့ကျင့်ခန်းလုပ်ပါ။',
    money: 'Generous spending but maintain savings. Budget wisely.',
    moneyMy: 'ငွေသုံးလိုသော်လည်း သိမ်းဆည်းမှုထိန်းပါ။ ဘတ်ဂျက်ကို ကျစ်လျစ်စွာထားပါ။',
    moneyAdvice: 'Set spending limits. Track discretionary expenses.',
    moneyAdviceMy: 'ငွေသုံးစွဲမှုကန့်သတ်ပါ။ ရွေးချယ်သုံးစွဲမှုတွေကို စောင့်ကြည့်ပါ။',
  },
  June: {
    career: 'Mid-year review time. Assess progress and adjust goals.',
    careerMy: 'နှစ်လယ်စစ်ဆေးချိန်။ တိုးတက်မှုကို စစ်ဆေးပြီး ရည်မှန်းချက်တွေကို ချိန်ညှိပါ။',
    careerAdvice: 'Reflect on achievements. Plan second half.',
    careerAdviceMy: 'အောင်မြင်မှုတွေကို ပြန်စဉ်းစားပါ။ နှစ်နှစ်းကို စီစဉ်ပါ။',
    love: 'Passion and romance peak. Celebrate your relationship.',
    loveMy: 'ချစ်စရာစိတ်နှင့် ချစ်စရာစိတ်မြင့်မားပါ။ ဆက်ဆံရေးကို ဂုဏ်ပြုပါ။',
    loveAdvice: 'Plan special moments together. Show appreciation.',
    loveAdviceMy: 'အထူးခြင်းဖွယ်အချိန်တွေကို စီစဉ်ပါ။ ကျေးဇူးတင်ပါ။',
    health: 'Summer wellness focus. Stay hydrated and protected.',
    healthMy: 'နွေရာသီကျန်းမာရေးအတွက် အဓိကထားပါ။ ရေသောက်ပြီး ကာကွယ်ပါ။',
    healthAdvice: 'Use sun protection. Drink plenty of water.',
    healthAdviceMy: 'နေလှုပ်ကာကွယ်ပါ။ ရေများသောက်ပါ။',
    money: 'Vacation expenses planned. Budget for summer fun.',
    moneyMy: 'ခရီးသွားကုန်ကျစရိတ်စီစဉ်ပါ။ နွေရာသီကစားပွဲအတွက် ဘတ်ဂျက်ထားပါ။',
    moneyAdvice: 'Plan travel expenses. Look for deals.',
    moneyAdviceMy: 'ခရီးသွားကုန်ကျစရိတ်ကို စီစဉ်ပါ။ အထူးအမြတ်တွေကို ရှာပါ။',
  },
  July: {
    career: 'Leadership opportunities. Take charge of projects.',
    careerMy: 'ခေါင်းဆောင်မှုအခွင့်အလမ်းရှိပါ။ ပရောဂျီတွေကို ဦးဆောင်ပါ။',
    careerAdvice: 'Step up to challenges. Demonstrate capability.',
    careerAdviceMy: 'စိန်ခေါ်မှုတွေကို ဦးဆောင်ပါ။ စွမ်းရည်ကို ပြသပါ။',
    love: 'Deep emotional connection. Intimacy strengthens bonds.',
    loveMy: 'စိတ်ခံစားမှုနက်ရှိုင်းပါ။ နီးကပ်မှုက ဆက်ဆံရေးကို ခိုင်မားစေပါ။',
    loveAdvice: 'Quality time together. Nurture your relationship.',
    loveAdviceMy: 'အချိန်ကောင်းတွေကို အတူနေပါ။ ဆက်ဆံရေးကို ပြုစုပါ။',
    health: 'Self-care essential. Prioritize mental health.',
    healthMy: 'ကိုယ်ပိုင်စောင့်ရှောက်မှုအရေးကြီးပါ။ စိတ်ကျန်းမာရေးကို အဓိကထားပါ။',
    healthAdvice: 'Take breaks. Practice stress management.',
    healthAdviceMy: 'အနားယူပါ။ စိတ်ဖိစီးမှုစီမံပါ။',
    money: 'Mid-year financial check. Adjust budget as needed.',
    moneyMy: 'နှစ်လယ်ငွေကြေးစစ်ဆေးမှု။ လိုသောအခါ ဘတ်ဂျက်ချိန်ညှိပါ။',
    moneyAdvice: 'Review financial goals. Make necessary adjustments.',
    moneyAdviceMy: 'ငွေကြေးရည်မှန်းချက်တွေကို စစ်ဆေးပါ။ လိုအပ်သောချိန်ညှိမှုတွေလုပ်ပါ။',
  },
  August: {
    career: 'Recognition and rewards. Hard work pays off.',
    careerMy: 'ချီးမြှောက်မှုနှင့် ဆုလာဘ်တွေ။ အလုပ်မှန်ကန်စွာလုပ်ပါ။',
    careerAdvice: 'Accept praise graciously. Share success with team.',
    careerAdviceMy: 'ချီးမြှောက်မှုကို လက်ခံပါ။ အောင်မြင်မှုကို အဖွဲ့နှင့်မျှဝေပါ။',
    love: 'Romance and fun. Enjoy playful moments together.',
    loveMy: 'ချစ်စရာစိတ်နှင့် ကစားပွဲ။ ကစားပွဲအချိန်တွေကို ခံစားပါ။',
    loveAdvice: 'Keep romance alive. Surprise your partner.',
    loveAdviceMy: 'ချစ်စရာစိတ်ကို ဆက်လက်ထိန်းသိမ်းပါ။ မိတ်ဖက်ကို သိုက်သိုက်မြိုက်မြိုက်လုပ်ပါ။',
    health: 'Peak energy levels. Maximize fitness routines.',
    healthMy: 'စွမ်းအင်အမြင့်စားရောက်ပါ။ ကျန်းမာရေးလေ့ကျင့်ခန်းကို အမြင့်ဆုံးဖြစ်စေပါ။',
    healthAdvice: 'Challenge yourself physically. Try new workouts.',
    healthAdviceMy: 'ကိုယ်ပိုင်စွမ်းအင်ကို စမ်းစစ်ပါ။ လေ့ကျင့်ခန်းအသစ်တွေကို စမ်းကြည့်ပါ။',
    money: 'Luxury purchases tempting. Practice mindful spending.',
    moneyMy: 'လူသုံးကုန်တွေဝယ်ချင်ပါ။ သိမ်းသိမ်းသုံးပါ။',
    moneyAdvice: 'Distinguish wants from needs. Save for big purchases.',
    moneyAdviceMy: 'လိုချင်တာနှင့် လိုအပ်တာကို ခွဲခြားပါ။ ကြီးသောဝယ်ယူမှုအတွက် သိမ်းဆည်းပါ။',
  },
  September: {
    career: 'Planning and organization. Set new career goals.',
    careerMy: 'စီမံကိန်းနှင့် စနစ်တကျဖွဲ့စည်းမှု။ အလုပ်ရည်မှန်းချက်အသစ်တွေချပါ။',
    careerAdvice: 'Organize your workspace. Plan ahead.',
    careerAdviceMy: 'အလုပ်နေရာကို စနစ်တကျဖွဲ့စည်းပါ။ ရှေ့ကို စီစဉ်ပါ။',
    love: 'Commitment and stability. Long-term relationships thrive.',
    loveMy: 'ကတိစောင့်ထိန်းမှုနှင့် မြဲမြံမှု။ ရှည်ပြီးဆက်ဆံရေးတွေ ဖွံ့ဖြိုးပါ။',
    loveAdvice: 'Discuss future plans. Build shared dreams.',
    loveAdviceMy: 'အနာဂတ်စီမံကိန်းတွေကို ဆွေးနွေးပါ။ မျှဝေသောအိပ်မက်တွေကို တည်ဆောက်ပါ။',
    health: 'Routine and discipline. Establish healthy habits.',
    healthMy: 'နေ့စဉ်လုပ်ဆောင်ချက်နှင့် စည်းကမ်း။ ကျန်းမာရေးအလေ့အကျင့်တွေစတည်းပါ။',
    healthAdvice: 'Create healthy routines. Stick to them.',
    healthAdviceMy: 'ကျန်းမာရေးနေ့စဉ်လုပ်ဆောင်ချက်တွေဖန်တီးပါ။ ဆက်လက်လုပ်ပါ။',
    money: 'Back-to-school expenses. Budget carefully.',
    moneyMy: 'ကျောင်းပြန်တက်ကုန်ကျစရိတ်။ ဘတ်ဂျက်ကို သေချာစွာထားပါ။',
    moneyAdvice: 'Plan educational expenses. Look for discounts.',
    moneyAdviceMy: 'ပညာရေးကုန်ကျစရိတ်ကို စီစဉ်ပါ။ လျှော့ဈေးတွေကို ရှာပါ။',
  },
  October: {
    career: 'Transition period. Prepare for new opportunities.',
    careerMy: 'ပြောင်းလဲရေးကာလ။ အခွင့်အလမ်းအသစ်တွေအတွက် ပြင်ဆင်ပါ။',
    careerAdvice: 'Be adaptable. Embrace change positively.',
    careerAdviceMy: 'ခေါင်းလောင်းလှည့်နိုင်ပါ။ ပြောင်းလဲမှုကို ကောင်းသောအားဖြင့်လက်ခံပါ။',
    love: 'Passion and transformation. Relationships evolve.',
    loveMy: 'ချစ်စရာစိတ်နှင့် ပြောင်းလဲမှု။ ဆက်ဆံရေးတွေ တိုးတက်ပါ။',
    loveAdvice: 'Embrace growth together. Support each other&apos;s evolution.',
    loveAdviceMy: 'အတူတကွ ဖွံ့ဖြိုးမှုကို လက်ခံပါ။ တစ်ဦးနှင့်တစ်ဦး ပံ့ပိုးပါ။',
    health: 'Immune system focus. Boost natural defenses.',
    healthMy: 'ကိုယ်ခံစွမ်းအားစနစ်ကို အဓိကထားပါ။ သဘာဝခံစွမ်းအားကို တိုးမြှင့်ပါ။',
    healthAdvice: 'Eat vitamin-rich foods. Get adequate sleep.',
    healthAdviceMy: 'ဗီတာမင်ပါသောအစားအသောက်တွေစားပါ။ လိုအပ်သောအိပ်ရေးရပါ။',
    money: 'Holiday planning begins. Start saving early.',
    moneyMy: 'အခမ်းအနားစီစဉ်မှုစတင်ပါ။ ရှေ့ရှုထားပါ။',
    moneyAdvice: 'Set holiday budget. Avoid debt.',
    moneyAdviceMy: 'အခမ်းအနားဘတ်ဂျက်ချပါ။ ကြွေးမြီမှ ရှောင်ပါ။',
  },
  November: {
    career: 'Year-end push. Finish strong on current projects.',
    careerMy: 'နှစ်နှစ်းတိုးတက်မှု။ လက်ရှိပရောဂျီတွေကို အားကောင်းစွာပြီးဆုံးပါ။',
    careerAdvice: 'Focus on completion. Celebrate achievements.',
    careerAdviceMy: 'ပြီးမြောက်မှုကို အာရုံစိုက်ပါ။ အောင်မြင်မှုတွေကို ဂုဏ်ပြုပါ။',
    love: 'Gratitude and appreciation. Express love freely.',
    loveMy: 'ကျေးဇူးတင်မှုနှင့် ချီးမြှောက်မှု။ ချစ်စရာစိတ်ကို ဖော်ပြပါ။',
    loveAdvice: 'Show gratitude daily. Nurture emotional bonds.',
    loveAdviceMy: 'နေ့စဉ်ကျေးဇူးတင်ပါ။ စိတ်ခံစားမှုဆက်သွယ်မှုကို ပြုစုပါ။',
    health: 'Preparation for winter. Boost immunity.',
    healthMy: 'ဆောင်းရာသီအတွက် ပြင်ဆင်မှု။ ကိုယ်ခံစွမ်းအားတိုးမြှင့်ပါ။',
    healthAdvice: 'Get flu shot. Maintain healthy habits.',
    healthAdviceMy: 'ဖလူးဝက်ချွေးတိုက်ဆေးထိုးပါ။ ကျန်းမာရေးအလေ့အကျင့်တွေထိန်းသိမ်းပါ။',
    money: 'Holiday shopping begins. Stick to budget.',
    moneyMy: 'အခမ်းအနားဝယ်ယူမှုစတင်ပါ။ ဘတ်ဂျက်ကို လိုက်နာပါ။',
    moneyAdvice: 'Make gift lists. Compare prices.',
    moneyAdviceMy: 'လက်ဆောင်စာရင်းတွေဖန်တီးပါ။ စျေးနှိုင်းပါ။',
  },
  December: {
    career: 'Year-end reflection. Plan for next year.',
    careerMy: 'နှစ်နှစ်းပြန်စဉ်းစားမှု။ နောက်နှစ်အတွက် စီစဉ်ပါ။',
    careerAdvice: 'Review annual progress. Set ambitious goals.',
    careerAdviceMy: 'နှစ်စဉ်တိုးတက်မှုကို စစ်ဆေးပါ။ ရည်မှန်းချက်မြင့်မားတွေချပါ။',
    love: 'Celebration and togetherness. Cherish time together.',
    loveMy: 'ဂုဏ်ပြုမှုနှင့် အတူနေမှု။ အတူနေချိန်ကို အလေးထားပါ။',
    loveAdvice: 'Create holiday memories. Express love generously.',
    loveAdviceMy: 'အခမ်းအနားမှတ်တမ်းတွေဖန်တီးပါ။ ချစ်စရာစိတ်ကို ကျယ်ကျယ်ပြန့်ပြန့်ဖော်ပြပါ။',
    health: 'Holiday wellness. Balance indulgence with health.',
    healthMy: 'အခမ်းအနားကျန်းမာရေး။ ကျန်းမာရေးနှင့် မျှတမှုရှာပါ။',
    healthAdvice: 'Enjoy treats in moderation. Stay active.',
    healthAdviceMy: 'အစားအသောက်တွေကို သင့်တင့်သလောက်ခံစားပါ။ လှုပ်ရှားဆဲဖြစ်ပါ။',
    money: 'Year-end financial review. Plan新年 budget.',
    moneyMy: 'နှစ်နှစ်းငွေကြေးစစ်ဆေးမှု။ နောက်နှစ်ဘတ်ဂျက်စီစဉ်ပါ။',
    moneyAdvice: 'Review spending habits. Set savings goals.',
    moneyAdviceMy: 'ငွေသုံးစွဲမှုအလေ့အကျင့်တွေကို စစ်ဆေးပါ။ သိမ်းဆည်းရည်မှန်းချက်တွေချပါ။',
  },
}

const months = Object.keys(monthlyForecasts)

export default function MonthlyForecast() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }))
  const [showMyanmar, setShowMyanmar] = useState(false)

  const forecast = monthlyForecasts[selectedMonth]

  const categories = [
    { key: 'career' as const, icon: Briefcase, label: 'Career', labelMy: 'အလုပ်ကိစ္စ' },
    { key: 'love' as const, icon: Heart, label: 'Love', labelMy: 'အိမ်ထောင်ရေး' },
    { key: 'health' as const, icon: Activity, label: 'Health', labelMy: 'ကျန်းမာရေး' },
    { key: 'money' as const, icon: DollarSign, label: 'Money', labelMy: 'ငွေကြေး' },
  ]

  return (
    <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Monthly Forecast</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">ဒီလ ဘာလုပ်ရမလဲ</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMyanmar(!showMyanmar)}
          className="rounded-full border border-[var(--accent-1)]/20 px-3 py-1 text-xs text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/10"
        >
          {showMyanmar ? 'English' : 'မြန်မာ'}
        </button>
      </div>

      {/* Month Selection */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        {months.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => setSelectedMonth(month)}
            className={`rounded-lg border px-3 py-2 text-center text-sm transition ${
              selectedMonth === month
                ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] hover:border-[var(--accent-1)]/40'
            }`}
          >
            {month}
          </button>
        ))}
      </div>

      {/* Forecast Content */}
      <div className="space-y-3">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <div
              key={category.key}
              className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--accent-1)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {showMyanmar ? category.labelMy : category.label}
                </p>
              </div>
              <p className="mb-2 text-sm text-[var(--text-primary)]">
                {showMyanmar ? forecast[`${category.key}My` as keyof ForecastData] : forecast[category.key]}
              </p>
              <div className="flex items-start gap-2 rounded-lg bg-[var(--accent-1)]/5 p-3">
                <TrendingUp className="h-4 w-4 text-[var(--accent-1)] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--accent-1)]">Advice: </span>
                  {showMyanmar ? forecast[`${category.key}AdviceMy` as keyof ForecastData] : forecast[`${category.key}Advice` as keyof ForecastData]}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
