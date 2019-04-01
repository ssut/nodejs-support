import {SentenceSplitter, Tagger, Parser, EntityRecognizer, RoleLabeler} from '../src/proc';
import {Morpheme, Word, Sentence, SyntaxTree, DepEdge, RoleEdge, Entity} from '../src/data';
import {POS} from '../src/types';
import {OKT, HNN, ETRI} from '../src/API';
import _ from 'underscore';

let EXAMPLES =
    `01 1+1은 2이고, 3*3은 9이다.
01 RHINO는 말줄임표를... 확인해야함... ^^ 이것도 확인해야.
03 식사함은 식사에서부터인지 식사에서부터이었는지 살펴봄. 보기에는 살펴봄이 아리랑을 위한 시험임을 지나쳤음에. 사랑하였음은 사랑해봄은 보고싶기에 써보기에 써보았기에.
03 먹음이니. 먹음이었으니. 사면되어보았기에.
01 a/b는 분수이다.
01 | 기호는 분리기호이다.
02 ▶ 오늘의 날씨입니다. ◆ 기온 23도는 낮부터임.
01 【그】가 졸음이다. 사랑스러웠기에.
01 [Dr.브레인 - 마루투자자문 조인갑 대표]
01 [결 마감특징주 - 유진투자증권 갤러리아지점 나현진 대리]
01 진경복 한기대 산학협력단장은 "이번 협약 체결로 우수한 현장 기능 인력에 대한 대기업-중소기업간 수급 불균형 문제와 중소·중견기업들에 대한 취업 기피 현상을 해결할 것"이라며 "특성화 및 마이스터고 학생들을 대학에 진학시켜 자기계발 기회를 제공하는 국내 최초의 상생협력 모델이라는 점에 의미가 있다"고 강조했다.
01 [결 마감특징주 - 신한금융투자 명품PB강남센터 남경표 대리]
01 [Dr.브레인 - 마루투자자문 조인갑 대표]
01 '플라이 아웃'은 타자가 친 공이 땅에 닿기 전에 상대팀 야수(투수와 포수를 제외한 야수들-1·2·3루수, 좌익수, 중견수, 우익수, 유격수)가 잡는 것, '삼진 아웃'은 스트라이크가 세 개가 되어 아웃되는 것을 말한다.
01 대선 출마를 선언한 민주통합당 손학규 상임고문이 5일 오후 서울 세종문화회관 세종홀에서 열린 '저녁이 있는 삶-손학규의 민생경제론'출판기념회에서 행사장으로 들어서며 손을 들어 인사하고 있다.2012.7.5/뉴스1

# Example 1: JTBC, 2017.04.22
03 북한이 도발을 멈추지 않으면 미국이 북핵 시설을 타격해도 군사개입을 하지 않겠다. 중국 관영 환구시보가 밝힌 내용인데요. 중국이 여태껏 제시한 북한에 대한 압박 수단 가운데 가장 이례적이고, 수위가 높은 것으로 보입니다.
01 이한주 기자입니다.
02 중국 관영매체 환구시보가 북핵문제에 대해 제시한 중국의 마지노선입니다. 북핵 억제를 위해 외교적 노력이 우선해야 하지만 북한이 도발을 지속하면 핵시설 타격은 용인할 수 있다는 뜻을 내비친 겁니다.
02 그러나 한국과 미국이 38선을 넘어 북한 정권 전복에 나서면 중국이 즉각 군사개입에 나서야 한다는 점을 분명히 하였습니다. 북한에 대한 압박수위도 한층 높였습니다.
02 핵실험을 강행하면 트럼프 대통령이 북한의 생명줄로 지칭한 중국의 원유공급을 대폭 축소할 거라고 경고하였습니다. 축소 규모에 대해서도 '인도주의적 재앙이 일어나지 않는 수준'이라는 기준까지 제시하며 안보리 결정을 따르겠다고 못 박았습니다.
02 중국 관영매체가 그동안 북한에 자제를 요구한 적은 있지만, 군사지원 의무제공 포기 가능성과 함께 유엔 안보리 제재안을 먼저 제시한 것은 이례적입니다. 미·중 빅딜에 따른 대북압박 공조 가능성이 제기되는 가운데 북한이 어떤 반응을 보일지 관심이 쏠립니다.

# Example2: 한국대학신문, 17.04.21
01 홍준표 '돼지흥분제 논란' 일파만파…사퇴 요구 잇달아(종합)
01 2005년 자서전서 성범죄 모의 내용 뒤늦게 알려져
01 "혈기왕성할 때" 한국당 해명도 빈축…국민의당·바른정당 사퇴 요구
02 자유한국당 홍준표 대선후보가 대학 시절 약물을 이용한 친구의 성범죄 모의에 가담하였다고 자서전에서 고백한 사실이 21일 뒤늦게 알려지면서 논란이 커지고 있다. 이를 접한 누리꾼들 사이에서 비난 여론이 비등한 상황에서 국민의당과 바른정당 등 정치권에선 홍 후보에게 사퇴를 요구하는 목소리가 나오고 있다.
02 문제가 된 부분은 홍 후보가 한나라당(자유한국당 전신) 의원으로 활동하던 2005년 출간한 자전적 에세이 '나 돌아가고 싶다'의 '돼지 흥분제 이야기' 대목이다. 홍 후보는 고려대 법대 1학년생 때 있었던 일이라면서 "같은 하숙집의 S대 1학년 남학생이 짝사랑하던 여학생을 월미도 야유회 때 자기 사람으로 만들겠다며 하숙집 동료들에게 흥분제를 구해달라고 하였다"고 밝혔다.
02 그는 이어 "우리 하숙집 동료들은 궁리 끝에 흥분제를 구해주기로 하였다"면서 해당 남학생이 맥주에 흥분제를 타서 여학생에게 먹였으나 여학생의 반발로 미수에 그친 점, 하숙집 동료들 간 흥분제 약효를 놓고 격론이 벌어진 점 등을 소개하였다. 이 내용을 발췌한 사진이 사회관계망서비스(SNS)를 타고 본격적으로 퍼지면서 인터넷에서는 명백한 성범죄 모의라면서 분노하는 여론이 크게 일었다.
01 이에 홍 후보는 이날 오전 서울 강남구 삼성동 코엑스에서 간담회를 마친 뒤 취재진과 만나 "내가 (성범죄에) 관여한 게 아니다"라고 해명하였다.
01 그는 "같이 하숙하던 S대 학생들이 하는 이야기를 옆에서 들은 것"이라면서 "책의 포맷을 보면 S대 학생들 자기네끼리 한 이야기를 내가 관여한 듯이 해놓고 후회하는 것으로 해야지 정리가 되는 그런 포맷"이라고 주장하였다.
03 하지만 온라인 여론은 싸늘하였다. 홍 후보가 스스로 글의 말미에 '가담'이라고 표현한만큼 "들은 이야기"라는 해명을 사실 그대로 받아들이기 어렵다는 것이다. 홍 후보는 책에 "다시 (과거로) 돌아가면 절대 그런 일에 가담하지 않을 것"이라며 "장난삼아 한 일이지만 그것이 얼마나 큰 잘못인지 검사가 된 후에 비로소 알았다"고 서술하였다.
02 "혈기왕성한 때 벌어진 일"이라는 한국당의 해명도 또다른 논란을 불렀다. 이 당 정준길 대변인은 이날 오전 tbs라디오 인터뷰에서 "당시에도 책에서 이미 잘못된 일이라고 반성하였고 지금 생각해도 잘못된 일"이라면서 "그것이 불쾌하였다면 국민에게 진심으로 사과드린다"고 말하였다.
01 그러면서 "다만 지금으로부터 45년 전, 사회적 분위기가 다른 상황에서 혈기왕성한 대학교 1학년 때 벌어진 일이라는 점을 너그럽게 감안해 주셨으면 좋겠다"고 덧붙여 비판을 샀다.
02 다른 당에서는 홍 후보에게 후보직 사퇴를 요구하면서 여론전에 나섰다. 국민의당 안철수 후보 측은 "홍 후보가 대학 시절 강간미수의 공동정범이었다는 사실이 재조명되었다"고 지적하면서 후보직 사퇴를 요구하였다.
01 국민의당 선거대책위 김경록 대변인은 논평을 통해 "대학교 1학년생에게 약물을 몰래 먹인 성폭력의 공범임이 드러난 이상 우리는 홍 후보를 대선 후보로 인정할 수 없다"면서 "한국당의 유일한 여성 공동선대위원장인 나경원 의원이 나서 홍 후보 자격을 박탈하라"고 요구하였다.
02 바른정당도 "여성에 저급한 인식을 보여준다"며 가세하였다. 유승민 대선후보는 이날 오전 여의도 서울마리나클럽에서 열린 한국방송기자클럽 대선후보 초청토론회에서 "충격적인 뉴스다. 이런 사람이 어떻게 대선 후보가 될 수 있느냐"고 목소리를 높였다.
01 바른당의 박순자·박인숙·이혜훈·이은재·진수희·김을동 등 전현직 여성 의원 10명도 이날 오후 국회 정론관 기자회견을 통해 홍 후보를 규탄하였다.
01 이들은 "현역 국회의원인 시점에 자서전을 내면서 부끄러운 범죄사실을 버젓이 써놓고 사과 한마디 없다는 것은 더 기막히다"라면서 "대선후보가 아닌 정상적인 사고를 가진 한 인간으로서도 자질부족인 홍 후보의 사퇴를 촉구한다"고 밝혔다.

# Example 3. 허핑턴포스트, 17.04.22
01 박근혜 전 대통령이 거주하던 서울 삼성동 자택은 홍성열 마리오아울렛 회장(63)이 67억5000만원에 매입한 것으로 확인되었다.
01 홍 회장은 21일 뉴스1과의 통화에서 "값이 싸게 나오고 위치가 좋아서 삼성동 자택을 사게 되었다"고 밝혔다.
01 홍 회장은 "제가 강남에 집이나 땅이 하나도 없어서 알아보던 중에 부동산에 아는 사람을 통해서 삼성동 자택이 매물로 나온 걸 알게 되었다"며 "처음에는 조금 부담되었지만 집사람도 크게 문제가 없다고 해서 매입하였다"고 말하였다.
01 이어 "조만간 이사를 할 생각이지만 난방이나 이런게 다 망가졌다기에 보고나서 이사를 하려한다"며 "집부터 먼저 봐야될 것 같다"고 하였다.
01 홍 회장은 한때 자택 앞에서 박 전 대통령 지지자들의 집회로 주민들이 큰 불편을 겪었던 것과 관련 "주인이 바뀌면 그런 일을 할 이유가 없을 것이라 생각한다"고 밝혔다.
01 박 전 대통령과의 인연 등에 대해선 "정치에 전혀 관심이 없고 그런(인연) 건 전혀 없다"며 "박 전 대통령 측이나 친박계 의원 측과의 접촉도 전혀 없었다"고 전하였다.
01 홍 회장은 일부 언론보도로 알려진 박지만 EG회장과의 친분설도 "사실과 다르다"며 "박 전 대통령 사돈의 팔촌과도 인연이 없다"고 거듭 강조하였다.
02 홍 회장에 따르면 자택 매입가는 67억5000만원이다. 홍 회장은 주택을 매입하면서 2억3600만원의 취득세를 납부하였다고 밝혔다.
01 홍 회장은 1980년 마리오상사를 설립한 뒤 2001년 마리오아울렛을 오픈하며 의류 판매업 등으로 국내 최대급 아울렛으로 성장시켰다.
01 한편 박 전 대통령은 최근 삼성동 자택을 매각하고 내곡동에 새 집을 장만한 것으로 확인되었으며 이달 중 내곡동으로 이삿짐을 옮길 것으로 알려졌다.

# Example 4. 블로터, 17.08.18
03 데이터는 미래의 먹거리다. 데이터는 끊임없이 생성되고 변화를 겪기도 한다. 많은 양의 데이터가 생기면서 이를 저장·관리하는 문제부터 어떻게 분석하고 사용하며 어떻게 이를 지켜 내야 하는지 다양한 고민도 함께 등장했다.
03 씨게이트 테크놀로지는 8월17일 열린 '씨게이트 데이터 토론회'에서 '데이터 에이지 2025' 백서를 발표했다. 시장조사기관 IDC 도움을 받아 조사했다. 이날 토론회에는 테 반셍 씨게이트 글로벌 세일즈 수석 부사장, 김수경 IDC코리아 부사장, 김의만 SAP코리아 상무가 참석해 데이터 미래에 관해 이야기를 나눴다.
01 데이터 생산 주체 '소비자' → '기업'으로
02 '데이터 에이지 2025' 백서에 따르면, 지난 20년 동안 디스크드라이브 업계가 출하한 하드디스크드라이브(HDD)는 80억개로, 용량은 약 4 제타바이트(ZB)에 이른다. 데이터 용량은 점점 늘어나 2025년에는 지금의 10배에 달하는 163 ZB가 생성될 전망이다.
04 1 ZB는 10해 바이트다. 풀어쓰면 '1,000,000,000,000,000,000,000 바이트'로 0이 무려 21개나 붙는다. 또, 1 ZB에 3 MB 안팎의 MP3 음악파일 281조5천억곡을 저장할 수 있다는 점에서, 163 ZB는 실로 어마어마한 규모다. 그러나 이런 데이터가 불과 8년 뒤, 머지않은 미래에 생성된다.
05 단순히 데이터 양만 늘어나고 있는 건 아니다. 데이터를 생산하는 주체도 변화중이다. 기존 20~30년간 상당수 데이터 생산 주체는 소비자였다. 소비자 대부분이 카메라, 모바일, 영상 등에서 데이터를 생산했다. 주로 영화, 음악과 같은 엔터테인먼트 종류 데이터가 많았다.
02 그러나 클라우드로 데이터가 이동하고, 사물인터넷(IoT)이 늘어나면서 기업이나 기계가 데이터를 생산하는 경우가 늘어나고 있다. 씨게이트 측은 2025년에는 전체 데이터의 60% 가량이 기업에 의해 생성될 것으로 분석했다.
01 연결과 새로운 기술, 데이터 증폭을 부르다
04 8년 뒤, 데이터양이 163 ZB로 늘어나는 데는 몇 가지 원인이 있다. 의료나 항공 등 생명에 연관된 분야에서 사용하는 기기가 늘어난 덕이다. M2M, IoT 기기를 이용한 데이터 수집 사례도 늘어나고 있다는 점도 빼놓을 수 없다. 과거와 다르게 모든 분야에서 데이터를 수집할 수 있는 기회가 늘어남에 따라 행동 자료, 정보 등이 물밀듯 밀려들어 온다.
02 모바일과 실시간 데이터 사용량 증가도 데이터양 증가에 기여한다. 반셍 씨게이트 글로벌 세일즈 수석 부사장은 "2025년이 되면 전세계 인구 75%가 모바일 기기로 연결될 만큼 상당한 모바일 보급이 예상된다"라며 "이 외에 40조 달러 규모의 비즈니스를 차지하는 인공지능과 같은 새로운 코그니티브(인지) 시스템도 삶에 큰 영향을 줄 만큼 데이터를 사용하고 만들어낼 것이며, 이를 위한 보안 문제도 데이터 증폭 환경에 있어 주요 사안이다"라고 설명했다.
01 '엣지 구간'을 주목하라
02 데이터 처리 과정은 크게 3단계로 이뤄진다. 스마트폰과 PC 등 사용자로부터 바로 데이터를 모으는 '엔드포인트', 이렇게 모은 데이터를 데이터센터로 전달하는 '엣지', 데이터센터에서 데이터를 모아 처리하는 구간인 '코어'로 나뉜다.
02 반셍 수석 부사장은 이 중 엣지 구간을 주목했다. 생성된 정보를 신속하게 분석하고 그에 따라 초 단위 의사 결정이 필요해지면서, 엣지 구간에서 할 일이 많고 중요하다는 이유에서다.
02 많은 양의 데이터가 생기는데 이를 가치 있는 데이터로 만들기 위해서는 분석이 필요합니다. 하지만 신속한 의사결정이 중요시되는 현재인만큼 엔드포인트와 데이터센터 간 거리는 방해 요소가 될 수 있습니다.
01 스토리지의 미래 : 씨게이트 빅데이터 토론회
02 즉각적인 처리가 중요한 데이터가 늘어난다는 엣지의 개념이 흥미롭다. 엣지에서의 데이터가 어떤 방식으로 늘어나고, 어떤 식으로 처리돼 엔터프라이즈 레벨로 넘어가는가.
08 김의만 SAP코리아 상무(이하 SAP) : SAP에서도 엣지에서 발생하는 데이터 분석, 실시간 의사결정에 관심이 많다. 지난 5월에 열린 SAP 사파이어 컨퍼런스에서 '레오나르도'라는 플랫폼을 발표했다. 이 플랫폼도 엣지 컴퓨팅이 중요 개념으로 꼽았다. 자율주행차도 그렇고, 밀리세컨드로 데이터가 발생하는 공장 설비 같은 부분이 있다. 그런 데이터를 실제 클라우드 플랫폼, 온프레미스로 넘기기는 그 양이 너무나 많다. 또한, 그 양을 모두 수집·분석해 문제 발생에 즉각 대응하기에는 시간이 많이 든다. 그래서 엣지 단에 있는 예측 모델을 기반으로 해서, 실시간 데이터를 기반으로 의사결정을 할 수 있는 시스템을 생각한다. 차후 가장 중요한 데이터, 기업에서 사용되는 중대한 데이터를 실제 데이터 센터로 넘겨서 분석할 수도 있다.
02 지금 발생하는 데이터 중 5% 만이 저장되고 있다고 하는데, 앞으로 데이터는 더 늘어갈 것이다. 이 상황에 데이터 순위를 정해 더 중요하고, 덜 중요한 것으로 처리를 하는 것이 좋을까.
09 테 반셍 씨게이트 글로벌 세일즈 수석 부사장(이하 씨게이트) : 그렇다, 앞으로 데이터는 더 많이 증가할 것이다. 그러나 모두 저장되진 않을것이다. 어떤 데이터를 저장할지에 대해 의사결정을 내리는 것은 앞으로 수년동안 기준을 만들어 결정해야 할 일인듯하다. 지금까지는 비교적 쉽고 간단했다. 그러나 IoT나 M2M(Machine to Machine, 기계간 연결)이 등장하면서 데이터가 더 많아졌다. 하지만 원시데이터 자체를 저장하진 않을 것이다. 그러나 알다시피 분석되지 않는 데이터는 유용하지 않다. AI나 딥러닝과 관련해서 우리가 분석을 원하는 데이터의 양 정보의 양 자체가 훨씬 커질 것이고, 미래에는 데이터 복잡성이 10배 정도 증가할 것이다. 그 많은 데이터 안에서 생활에 아주 큰 영향을 미치는 것들을 분석·저장하고자 할 것이다.
01 인공지능 기술이 발전하면서 데이터의 중요성이 새롭게 밝혀질 수도 있을 듯하다.
03 김수겸 IDC코리아 부사장(이하 IDC) : 데이터 양에 비해 생각하는 것보다 저장해야 하는 데이터는 생각보다 많지 않을 수 있다. 인공지능이 데이터를 분석하더라도 너무 많은 데이터는 확인 후 버리거나 중요한 것에 한해 요약본을 가질 것이다. 중요한 데이터만 기준을 적용한다.
03 많은 데이터를 처리하면서 새로운 정보나 인사이트를 얻을 수도 있지만, 예측하지 못했던 취약점도 나타날 수 있다. 개별적으로 보면 의미가 없던 것이 하나로 합쳐졌을 때 개인 정보일 수도 있듯이 말이다. 이런 취약점에는 어떻게 대응할 수 있을까.
08 씨게이트 : 데이터의 증가로 나타날 수 있는 이슈는 4가지가 있다. 어디에 데이터를 저장할 것인지, 생성된 방대한 데이터를 어떻게 분석할 것인지, 데이터를 엔드포인트에서 코어로 어떻게 이동시킬 것인지, 그리고 마지막으로 데이터의 보안까지. 앞서서 말한 것처럼 전체적으로 보안이 되어야 하는 절반 정도만이 보안 적용돼 있다. 이를 해결하기 위해서는 어디서 데이터를 보호하고 어느 만큼 커버할 것인지 단계별 보완책을 만들어야 한다. 씨게이트는 데이터 센터를 위한 솔루션을 공급하면서 암호화가 가능한 기기가 제공할 수 있지만, 엔드포인트에서 보안 취약점이 남아있을 수도 있다. 이런 부분에서는 솔루션을 우리가 모색을 해야한다. 엔드포인트-엣지-코어로 데이터 이동에도 적용 가능한 보안 점이 필요하고 현재는 부족한 점이 있다. 업계에서 이 부분을 해소해야 할 솔루션에 대한 고민이 필요하다.
02 데이터를 보안 수준에 여러 단계로 나눠서 볼 수도 있다. 그러면 2025년 이후에는 어떤 정도의 보안이 필요할까.
06 IDC : 일단 데이터마다 보안 문제가 다르다. 개인데이터, 규정을 따라야 하는 데이터, 기업 또는 나라의 보안자료 등 다양한 데이터가 있는데, 모든 데이터를 처리할 수는 없다. 많은 논란이 있긴 하지만, 이를 관리하는 주체는 개인보다는 기업과 같은 큰 곳에 맡겨서 관리하는 게 더 중요하다고 본다. 그러니 2025년까지 실질적으로 모든 데이터가 보안이 다 필요하다. 그 역할을 해주는 주체가 기업이 되어야 할 것이고 이 영역에는 많은 투자와 기회가 있다고 생각한다. IDC는 보안이 향후 비즈니스 기회라고 보고 있다.
03 보안이라는 이슈가 기업이나 개인을 위한 보안일 수도 있으나 규제 문제를 일으킬 수도 있다. 브렉시트의 경우 유럽 테크 기업의 길을 바꿀 수 있다는 소리도 나온다. 데이터 보호주의가 엔터프라이즈 데이터 저장에 방해가 되지 않을까.
04 IDC : 더 많은 데이터센터가 생겨 지역 특성에 맞춰 전략을 가지고 공략할 수 있어야 한다. 원하는 곳에서 사업을 하기 위해서는 로컬 영역으로 들어가야 한다. 물리적으로 보기에는 데이터센터에 투자를 하는 게 가치가 있다고 본다. 규제가 있어 장벽이 생기면 또 다른 투자의 기회가 되고, 사업 기회가 될 것이다.
03 씨게이트 : 데이터센터가 늘어날수록 수익창출의 기회가 늘어나는 건 사실이다. 데이터센터가 많아지면 전력, 냉각 문제 등 더 많은 자원을 요구하고 또 다른 문제, 또 다른 도전이 생길 순 있으나, 어떤 도전이든 많은 기회를 의미한다. 업계 차원에서는 이를 낙관적으로 본다.
05 SAP : SAP는 클라우드 퍼스트를 이야기하고, 클라우드를 적극적으로 활용하는 것을 추천한다. 그러나 결론적으로 규제에 따른 제약 같은 부분을 생각하면 각각의 개별기업이 실제 대처하기에는 어려울 수도 있다. 데이터센터를 나라마다 짓기도 어렵다. 각 나라의 클라우드 센터의 애플리케이션 사용하거나 데이터를 저장해 규제나 위반에 대한 위험성를 피해갈수도 있다고 생각한다. 한국에도 클라우드 센터가 많이 지어 지고 있는데, 보호무역주의가 강화되며 클라우드센터와 같은 데이터센터가 늘어날 것이라는 생각이다.
01 데이터 자체가 늘어나면서 기업과 소비자에 각각 어떤 변화가 올 것이며 어떻게 대비를 해야 하는가.
04 SAP : 빅데이터는 IoT나 센서에서 발생하는 많은 데이터에 숨겨진 패턴 찾는 것이 중요하다. 또 한편으로는, 기업들이 가지고 있는 비즈니스 데이터와 빅데이터에서 찾은 데이터를 어떻게 결합하느냐도 중요하다. 어떻게 자신이 가지고 있는 데이터와 결합할 것인지에 대한 비즈니스 시나리오를 고민 해야 한다. 기업고객이 원하는 바와 어떻게 연관시킬 것인가와 연결할 수 있어야 하고, 그런 부분이 종합적으로 고민돼 결과를 도출해야 기업이 향후 영위하는 수익창출에 도움이 될 것이라고 본다.
04 IDC : 기업은 디지털 변혁이 필요하다. 기존에 기반기술(클라우드, 빅데이터, 소셜 비즈니스, 모바일 비즈니스 등)을 바탕으로 AI나 IoT, 로보틱스, 휴먼인터페이스, 3D 페인팅 그리고 이를 다 관장하는 보안 기술까지 모두 중요하다. 앞으로 이런 기술에 맞춰 소비자-기업 관계, 소비자 경험, 생산설비 변경 등 여러 가지가 바뀌어야 한다. 이 같은 환경이 확산되면 디지털 경제가 만들어질 것이다.
11 씨게이트 : 기업 관점에서 보자면 데이터 폭증에 대비해 데이터를 어디에 저장하고, 데이터를 어떻게 분석·처리하며, 데이터를 어떻게 이동하고, 그것을 어떻게 비즈니스에 유용하게 쓰는지에 대해 생각해야 한다. 나아가 이 모든 데이터를 어떻게 보호하느냐 역시 고려해야 한다. 업계의 일원으로서 이런 문제를 봤을 때 당면하는 과제는 결국 어떤 솔루션을 제공해야 이 같은 문제를 극복할 수 있을까로 요약된다. 아직은 엣지 디바이스가 많지는 않지만 앞으로 더 많은 새로운 디바이스가 나올 것이다. 이 상황에 현재 보안은 필요한 만큼의 절반 정도 밖에 충족하지 못하고 있다. 여기서 사업 기회를 찾을 수 있다. 새로운 기회가 될 수 있기에 밝고 낙관적인 전망이 있다고 이야기 하고 싶다. 소비자로서는 모든 것을 통해 혜택을 누릴 수 있다. 생활이 한결 편리해질 것이다. 아무래도 가장 큰 문제는 사생활 문제와 보안이다. 결과적으로 개인은 편안한 삶을 영위하면서도 프라이버시와 보안에 신경을 써야 하고, 기술발전이 어떤 변화를 몰고 올지 역시 생각해야 한다.`
        .trim().split('\n').filter((line) => line.length > 0 && !line.startsWith('#')).map((line) => {
        line = line.trim();
        return [parseInt(line.substring(0, 2)), line.substring(3)];
    });


function isDefined(obj){
    return typeof obj !== 'undefined' && obj !== null;
}


function isUndefined(obj){
    return typeof obj === 'undefined';
}


function compareMorphemes(jsmorph, opts){
    expect(jsmorph).toBeInstanceOf(Morpheme);
    expect(jsmorph.getId()).toBe(jsmorph.reference.getId());
    expect(jsmorph.getTag().tagname).toBe(jsmorph.reference.getTag().name());
    expect(jsmorph.getOriginalTag()).toBe(jsmorph.reference.getOriginalTag());
    expect(jsmorph.getSurface()).toBe(jsmorph.reference.getSurface());
    expect(jsmorph.getWord().reference.equals(jsmorph.reference.getWord())).toBe(true);

    expect(jsmorph.getId()).toBe(jsmorph.id);
    expect(jsmorph.getTag()).toBe(jsmorph.tag);
    expect(jsmorph.getOriginalTag()).toBe(jsmorph.originalTag);
    expect(jsmorph.getSurface()).toBe(jsmorph.surface);
    expect(jsmorph.getWord()).toBe(jsmorph.word);
    expect(jsmorph.getWord().equals(jsmorph.word)).toBe(true);

    if(opts.NER && isDefined(jsmorph.reference.getEntities())){
        let jsents = jsmorph.getEntities().map((e) => e.reference);
        let jents = jsmorph.reference.getEntities();
        expect(jsents.every((e) => jents.contains(e))).toBe(true);
    }else{
        expect(jsmorph.getEntities()).toHaveLength(0);
    }

    expect(jsmorph.getEntities()).toEqual(jsmorph.entities);

    if(opts.WSD){
        expect(jsmorph.getWordSense()).toBe(jsmorph.reference.getWordSense());
        expect(jsmorph.getWordSense()).toBe(jsmorph.wordSense);
    }else{
        expect(isUndefined(jsmorph.getWordSense())).toBe(true);
        expect(isUndefined(jsmorph.wordSense)).toBe(true);
    }

    expect(jsmorph.isJosa()).toBe(jsmorph.reference.isJosa());
    expect(jsmorph.isModifier()).toBe(jsmorph.reference.isModifier());
    expect(jsmorph.isNoun()).toBe(jsmorph.reference.isNoun());
    expect(jsmorph.isPredicate()).toBe(jsmorph.reference.isPredicate());

    expect(
        POS.values().every((tag) => jsmorph.hasTag(tag.tagname) === jsmorph.reference.hasTag(tag.tagname))
    ).toBe(true);

    let sampled = _.sample(POS.values(), 3).map((x) => x.tagname);
    expect(jsmorph.hasTagOneOf(...sampled)).toBe(jsmorph.reference.hasTagOneOf(...sampled));

    expect(jsmorph.toString()).toBe(jsmorph.reference.toString());
}


function compareWords(jsword, opts){
    expect(jsword).toBeInstanceOf(Word);

    for(const morph of jsword){
        expect(jsword.reference.contains(morph.reference)).toBe(true);
        compareMorphemes(morph, opts);
    }

    expect(jsword.getSurface()).toBe(jsword.reference.getSurface());
    expect(jsword.getId()).toBe(jsword.reference.getId());
    expect(jsword.singleLineString()).toBe(jsword.reference.singleLineString());

    expect(jsword.getSurface()).toBe(jsword.surface);
    expect(jsword.getId()).toBe(jsword.id);

    if(opts.NER && isDefined(jsword.reference.getEntities())){
        let jsents = jsword.getEntities().map((e) => e.reference);
        let jents = jsword.reference.getEntities();
        expect(jsents.every((e) => jents.contains(e))).toBe(true);
    }else{
        expect(jsword.getEntities()).toHaveLength(0);
    }

    expect(jsword.getEntities()).toEqual(jsword.entities);

    if(opts.SRL){
        if(isDefined(jsword.reference.getPredicateRoles())){
            let jsents = jsword.getPredicateRoles().map((e) => e.reference);
            let jents = jsword.reference.getPredicateRoles();
            expect(jsents.every((e) => jents.contains(e))).toBe(true);
        }

        if(isDefined(jsword.reference.getArgumentRoles())){
            let jsents = jsword.getArgumentRoles().map((e) => e.reference);
            let jents = jsword.reference.getArgumentRoles();
            expect(jsents.every((e) => jents.contains(e))).toBe(true);
        }
    }else{
        expect(jsword.getPredicateRoles()).toHaveLength(0);
        expect(jsword.getArgumentRoles()).toHaveLength(0);
    }

    expect(jsword.getPredicateRoles()).toEqual(jsword.predicateRoles);
    expect(jsword.getArgumentRoles()).toEqual(jsword.argumentRoles);

    if(opts.DEP){
        if(isDefined(jsword.reference.getGovernorEdge())){
            expect(
                jsword.getGovernorEdge().reference.equals(jsword.reference.getGovernorEdge())
            ).toBe(true);
            expect(jsword.getGovernorEdge()).toBe(jsword.governorEdge);
        }

        if(isDefined(jsword.reference.getDependentEdges())){
            let jsents = jsword.getDependentEdges().map((e) => e.reference);
            let jents = jsword.reference.getDependentEdges();
            expect(jsents.every((e) => jents.contains(e))).toBe(true);
        }
    }else{
        expect(isUndefined(jsword.getGovernorEdge())).toBe(true);
        expect(jsword.getDependentEdges()).toHaveLength(0);
    }

    expect(jsword.getDependentEdges()).toEqual(jsword.dependentEdges);

    if(opts.SYN){
        expect(jsword.getPhrase().reference.equals(jsword.reference.getPhrase())).toBe(true);
        expect(jsword.getPhrase()).toEqual(jsword.phrase);
    }else{
        expect(isUndefined(jsword.getPhrase())).toBe(true);
        expect(isUndefined(jsword.phrase)).toBe(true);
    }

    expect(jsword.toString()).toBe(jsword.reference.toString());
}


function comparePhrase(jstree){
    expect(jstree).toBeInstanceOf(SyntaxTree);
    expect(jstree.getLabel().tagname).toBe(jstree.reference.getLabel().name());
    expect(jstree.hasNonTerminals()).toBe(jstree.reference.hasNonTerminals());
    expect(jstree.isRoot()).toBe(jstree.reference.isRoot());
    expect(jstree.getOriginalLabel()).toBe(jstree.reference.getOriginalLabel());
    expect(jstree.getTreeString()).toBe(jstree.reference.getTreeString().toString());

    expect(jstree.getLabel()).toBe(jstree.label);
    expect(jstree.getOriginalLabel()).toBe(jstree.originalLabel);

    let jsterms = jstree.getTerminals().map((t) => t.reference);
    let jterms = jstree.reference.getTerminals();
    expect(jsterms.every((e) => jterms.contains(e))).toBe(true);

    let jsnterms = jstree.getNonTerminals().map((t) => t.reference);
    let jnterms = jstree.reference.getNonTerminals();
    expect(jsnterms.every((e) => jnterms.contains(e))).toBe(true);

    if(!jstree.reference.isRoot()){
        expect(jstree.getParent().reference.equals(jstree.reference.getParent())).toBe(true);
        expect(jstree.getParent()).toEqual(jstree.parent);
    }else{
        expect(isUndefined(jstree.getParent())).toBe(true);
        expect(isUndefined(jstree.parent)).toBe(true);
    }

    for(const nonterm of jstree){
        expect(jstree.reference.contains(nonterm.reference)).toBe(true);
        comparePhrase(nonterm);
    }

    expect(jstree.toString()).toBe(jstree.reference.toString());
}

function compareDepEdge(jsedge){
    expect(jsedge).toBeInstanceOf(DepEdge);
    expect(jsedge.getOriginalLabel()).toBe(jsedge.reference.getOriginalLabel());
    expect(jsedge.getType().tagname).toBe(jsedge.reference.getType().name());

    expect(jsedge.getOriginalLabel()).toBe(jsedge.originalLabel);
    expect(jsedge.getType()).toBe(jsedge.type);

    let gov = jsedge.getGovernor();
    if(isDefined(jsedge.reference.getGovernor())){
        expect(gov).toBeDefined();
        expect(gov.reference.equals(jsedge.reference.getGovernor())).toBe(true);
        expect(jsedge.getSrc().reference.equals(jsedge.reference.getSrc())).toBe(true);
        expect(gov).toBe(jsedge.getSrc());
        expect(gov).toBe(jsedge.governor);
        expect(jsedge.getSrc()).toBe(jsedge.src);
    }else{
        expect(isDefined(jsedge.reference.getGovernor())).toBe(false);
        expect(isDefined(jsedge.reference.getSrc())).toBe(false);
        expect(isUndefined(jsedge.getGovernor())).toBe(true);
        expect(isUndefined(jsedge.getSrc())).toBe(true);
        expect(isUndefined(jsedge.governor)).toBe(true);
        expect(isUndefined(jsedge.src)).toBe(true);
    }

    expect(jsedge.getDependent().reference.equals(jsedge.reference.getDependent())).toBe(true)
    expect(jsedge.getDest().reference.equals(jsedge.reference.getDest())).toBe(true);
    expect(jsedge.getDependent()).toBe(jsedge.getDest());
    expect(jsedge.getDependent()).toBe(jsedge.dependent);
    expect(jsedge.getDest()).toBe(jsedge.dest);

    if(isDefined(jsedge.reference.getDepType())){
        expect(jsedge.getDepType().tagname).toBe(jsedge.reference.getDepType().name());
        expect(jsedge.getLabel().tagname).toBe(jsedge.reference.getLabel().name());
        expect(jsedge.getDepType()).toBe(jsedge.getLabel());
        expect(jsedge.getDepType()).toBe(jsedge.depType);
        expect(jsedge.getLabel()).toBe(jsedge.label);
    }else{
        expect(isDefined(jsedge.reference.getDepType())).toBe(false);
        expect(isDefined(jsedge.reference.getLabel())).toBe(false);
        expect(isUndefined(jsedge.getLabel())).toBe(true);
        expect(isUndefined(jsedge.getDepType())).toBe(true);
        expect(isUndefined(jsedge.label)).toBe(true);
        expect(isUndefined(jsedge.depType)).toBe(true);
    }

    expect(jsedge.toString()).toBe(jsedge.reference.toString());
}

function compareRoleEdge(jsedge){
    expect(jsedge).toBeInstanceOf(RoleEdge);
    expect(jsedge.getOriginalLabel()).toBe(jsedge.reference.getOriginalLabel());
    expect(jsedge.getLabel().tagname).toBe(jsedge.reference.getLabel().name());
    expect(jsedge.getOriginalLabel()).toBe(jsedge.originalLabel);
    expect(jsedge.getLabel()).toBe(jsedge.label);

    let gov = jsedge.getPredicate();
    if(isDefined(jsedge.reference.getPredicate())){
        expect(gov.reference.equals(jsedge.reference.getPredicate())).toBe(true);
        expect(jsedge.getSrc().reference.equals(jsedge.reference.getSrc())).toBe(true);
        expect(gov).toBe(jsedge.getSrc());
        expect(gov).toBe(jsedge.predicate);
        expect(jsedge.getSrc()).toBe(jsedge.src);
    }else{
        expect(isDefined(jsedge.reference.getPredicate())).toBe(false);
        expect(isDefined(jsedge.reference.getSrc())).toBe(false);
        expect(isUndefined(jsedge.getPredicate())).toBe(true);
        expect(isUndefined(jsedge.getSrc())).toBe(true);
        expect(isUndefined(jsedge.predicate)).toBe(true);
        expect(isUndefined(jsedge.src)).toBe(true);
    }

    expect(jsedge.getArgument().reference.equals(jsedge.reference.getArgument())).toBe(true);
    expect(jsedge.getDest().reference.equals(jsedge.reference.getDest())).toBe(true);
    expect(jsedge.getArgument()).toBe(jsedge.getDest());
    expect(jsedge.getArgument()).toBe(jsedge.argument);
    expect(jsedge.getDest()).toBe(jsedge.dest);

    expect(jsedge.toString()).toBe(jsedge.reference.toString());
}

function compareEntity(jsentity){
    expect(jsentity).toBeInstanceOf(Entity);
    expect(jsentity.getLabel().tagname).toBe(jsentity.reference.getLabel().name());
    expect(jsentity.getOriginalLabel()).toBe(jsentity.reference.getOriginalLabel());
    expect(jsentity.getSurface()).toBe(jsentity.reference.getSurface());
    expect(jsentity.getFineLabel()).toBe(jsentity.reference.getFineLabel());
    expect(jsentity.getLabel()).toBe(jsentity.label);
    expect(jsentity.getOriginalLabel()).toBe(jsentity.originalLabel);
    expect(jsentity.getSurface()).toBe(jsentity.surface);
    expect(jsentity.getFineLabel()).toBe(jsentity.fineLabel);
    // jsentity.getCorefGroup().reference.equals(jsentity.referecnce.getCorefGroup()).should.be.true()

    for(const i of _.range(jsentity.length)){
        let morph = jsentity[i];
        expect(morph).toBeInstanceOf(Morpheme);
        expect(jsentity.reference.contains(morph.reference)).toBe(true);
        expect(jsentity.reference.get(i).equals(morph.reference)).toBe(true);
    }

    expect(jsentity.toString()).toBe(jsentity.reference.toString());
}

function compareSentence(jssent, opts={}){
    expect(jssent).toBeInstanceOf(Sentence);
    expect(jssent.toString()).toBe(jssent.reference.toString());
    expect(jssent.singleLineString()).toBe(jssent.reference.singleLineString());

    expect(jssent.surfaceString()).toBe(jssent.reference.surfaceString());
    expect(jssent.surfaceString('//')).toBe(jssent.reference.surfaceString('//'));

    if(opts.NER){
        for(const e of jssent.getEntities()){
            expect(jssent.reference.getEntities().contains(e.reference)).toBe(true);
            compareEntity(e);
        }
    }else{
        expect(jssent.getEntities()).toHaveLength(0);
    }
    expect(jssent.getEntities()).toEqual(jssent.entities);

    if(opts.DEP){
        for(const e of jssent.getDependencies()){
            expect(jssent.reference.getDependencies().contains(e.reference)).toBe(true);
            compareDepEdge(e);
        }
    }else{
        expect(jssent.getDependencies()).toHaveLength(0);
    }
    expect(jssent.getDependencies()).toEqual(jssent.dependencies);

    if(opts.SRL){
        for(const e of jssent.getRoles()){
            expect(jssent.reference.getRoles().contains(e.reference)).toBe(true);
            compareRoleEdge(e);
        }
    }else{
        expect(jssent.getRoles()).toHaveLength(0);
    }
    expect(jssent.getRoles()).toEqual(jssent.roles);

    if(opts.SYN){
        comparePhrase(jssent.getSyntaxTree());
        expect(jssent.getSyntaxTree()).toEqual(jssent.syntaxTree);
    }else{
        expect(isUndefined(jssent.getSyntaxTree())).toBe(true);
        expect(isUndefined(jssent.syntaxTree)).toBe(true);
    }

    for (const word of jssent.getNouns()){
        expect(word).toBeInstanceOf(Word);
        expect(jssent.reference.getNouns().contains(word.reference)).toBe(true);
    }

    for (const word of jssent.getVerbs()){
        expect(word).toBeInstanceOf(Word);
        expect(jssent.reference.getVerbs().contains(word.reference)).toBe(true);
    }

    for (const word of jssent.getModifiers()){
        expect(word).toBeInstanceOf(Word);
        //jssent.reference.getModifiers().contains(word.reference).should.be.true();
    }

    for (const word of jssent){
        expect(jssent.reference.contains(word.reference)).toBe(true);
        compareWords(word, opts);
    }
}

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

export default function () {
    describe('proc Module', () => {
        let splitter;
        let tagger;
        let parser;
        let entityRecog;
        let roleLabeler;

        beforeAll(async() => {
            splitter = new SentenceSplitter(OKT);
            tagger = new Tagger(OKT);
            parser = new Parser(HNN);
            entityRecog = new EntityRecognizer(ETRI, {apiKey: process.env['API_KEY']});
            roleLabeler = new RoleLabeler(ETRI, {apiKey: process.env['API_KEY']});
        });

        describe('SentenceSplitter', () => {
            it('can handle empty sentence', async() => {
                expect(await splitter('')).toHaveLength(0);
                expect(splitter.sentencesSync('')).toHaveLength(0);
            });

            it('can convert Java output correctly', async() => {
                for (const [dummy, line] of EXAMPLES) {
                    let res = await splitter(line);
                    expect(res).toBeInstanceOf(Array);
                    expect(res[0]).toEqual(expect.arrayContaining([]));

                    let resSync = splitter.sentencesSync(line);
                    expect(res).toEqual(resSync);

                    let res2 = await splitter([line]);
                    expect(res).toEqual(res2);

                    let resSync2 = splitter.sentencesSync([line]);
                    expect(res2).toEqual(resSync2);
                }
            });
        });

        describe('Tagger', () => {
            it('can handle empty sentence', async() => {
                expect(await tagger('')).toHaveLength(0);
                expect(tagger.tagSync('')).toHaveLength(0);
            });

            it('can convert Java output correctly', async() => {
                for (const [cnt, line] of EXAMPLES) {
                    process.stdout.write('.');
                    let para = await tagger(line);
                    expect(para).toBeInstanceOf(Array);
                    for (const sent of para)
                        compareSentence(sent);

                    let paraSync = tagger.tagSync(line);
                    expect(_.zip(para, paraSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);

                    let single = await tagger.tagSentence(line);
                    expect(single).toBeInstanceOf(Array);
                    expect(single).toHaveLength(1);

                    let singleSync = tagger.tagSentenceSync(line);
                    expect(_.zip(single, singleSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);

                    let singles = await tagger.tagSentence(para.map((x) => x.surfaceString()));
                    expect(para).toHaveLength(singles.length);

                    let singlesSync = tagger.tagSentenceSync(para.map((x) => x.surfaceString()));
                    expect(_.zip(singles, singlesSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);
                }
            });
        });

        describe('Parser', () => {
            it('can handle empty sentence', async() => {
                expect(await parser('')).toHaveLength(0);
                expect(parser.analyzeSync('')).toHaveLength(0);
            });

            it('can convert Java output correctly', async() => {
                for (const [cnt, line] of EXAMPLES) {
                    process.stdout.write('.');
                    let para = await parser(line);
                    expect(para).toBeInstanceOf(Array);
                    for (const sent of para)
                        compareSentence(sent, {SYN: true, DEP: true});

                    let paraSync = parser.analyzeSync(line);
                    expect(_.zip(para, paraSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);

                    let singles = await parser(...para.map((x) => x.surfaceString()));
                    expect(para).toHaveLength(singles.length);

                    let singlesSync = parser.analyzeSync(...para.map((x) => x.surfaceString()));
                    expect(_.zip(singles, singlesSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);
                }
            });

            it('can relay outputs', async() => {
                for (const [cnt, line] of EXAMPLES) {
                    process.stdout.write('.');
                    let splits = await splitter(line);
                    let tagged = await tagger.tagSentence(splits);
                    expect(tagged).toHaveLength(splits.length);

                    let taggedSync = tagger.tagSentenceSync(splits);
                    expect(_.zip(tagged, taggedSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);

                    let para = await parser(tagged);
                    expect(para).toHaveLength(tagged.length);

                    let paraSync = parser.analyzeSync(tagged);
                    expect(_.zip(para, paraSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);

                    expect(para).toBeInstanceOf(Array);
                    for (const sent of para)
                        compareSentence(sent, {SYN: true, DEP: true});
                }
            });
        });

        describe('RoleLabeler', () => {
            it('can handle empty sentence', async() => {
                expect(await roleLabeler('')).toHaveLength(0);
                expect(roleLabeler.analyzeSync('')).toHaveLength(0);
            });

            it('can convert Java output correctly', async() => {
                for (const [cnt, line] of _.sample(EXAMPLES, 5)) {
                    await snooze(_.random(5000, 10000));

                    let para = await roleLabeler(line);
                    expect(para).toBeInstanceOf(Array);
                    for (const sent of para)
                        compareSentence(sent, {SRL: true, DEP: true, NER: true, WSD: true});

                    let paraSync = roleLabeler.analyzeSync(line);
                    expect(_.zip(para, paraSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);

                    let singles = await roleLabeler(...para.map((x) => x.surfaceString()));
                    expect(para).toHaveLength(singles.length);

                    let singlesSync = roleLabeler.analyzeSync(...para.map((x) => x.surfaceString()));
                    expect(_.zip(singles, singlesSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);
                }
            });
        });

        describe('EntityRecognizer', () => {
            it('can handle empty sentence', async() => {
                expect(await entityRecog('')).toHaveLength(0);
            });

            it('can convert Java output correctly', async() => {
                for (const [cnt, line] of _.sample(EXAMPLES, 5)) {
                    await snooze(_.random(5000, 10000));

                    let para = await entityRecog(line);
                    expect(para).toBeInstanceOf(Array);
                    for (const sent of para)
                        compareSentence(sent, {NER: true, WSD: true});

                    let paraSync = entityRecog.analyzeSync(line);
                    expect(_.zip(para, paraSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);

                    let singles = await entityRecog(...para.map((x) => x.surfaceString()));
                    expect(para).toHaveLength(singles.length);

                    let singlesSync = entityRecog.analyzeSync(...para.map((x) => x.surfaceString()));
                    expect(_.zip(singles, singlesSync).every((tuple) => tuple[0].equals(tuple[1]))).toBe(true);
                }
            });
        });
    });
}