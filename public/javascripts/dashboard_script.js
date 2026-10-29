gsap.to(".letter", {
    opacity: 1,
    y: 0,
    stagger: 0.05,
    duration: 0.2,
    ease: "power2.out"
});
setTimeout(()=>{ 
  //  document.querySelector('.loading').style.display = 'none'
  //  document.querySelector('.content').style.display = 'block'
//   gsap.to(".letter", {
//     opacity: 1,
//     y: 0,
//     stagger: 0.05,
//     duration: 0.2,
//     ease: "power2.out"
// });
  document.querySelector('.loading').classList.add('hidden')
  document.querySelector('.container').style.display = 'block'
  setTimeout(() => {
     document.querySelector('.loading').style.display = "none";
  }, 1000);

  
},2000);
let hammenu = document.getElementById('hammenu')
let sidebar = document.getElementsByClassName('sidebar')[0]
let x = 0
hammenu.addEventListener('click',()=>{
   if(x==0){
    sidebar.style.display = 'block'
    x = 1
    hammenu.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
</svg>`
    hammenu.style.color = 'white'
   }else{
    sidebar.style.display = 'none'
    x = 0
    hammenu.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
</svg>`
    hammenu.style.color = 'black'
   }
})
document.addEventListener('DOMContentLoaded',async function () {
    function generateGreyShades(n) {
        if (n < 1) return [];
        if (n > 254) {
            console.error("Maximum 254 shades are possible (excluding black and white).");
            return [];
        }
    
        let shades = [];
        let step = Math.floor(254 / (n + 1)); 
    
        for (let i = 1; i <= n; i++) {
            let shade = 255 - i * step;
            let hex = `#${shade.toString(16).padStart(2, '0').repeat(3)}`;
            shades.push(hex);
        }
    
        return shades;
    }
    function calculateInterest(startDate, endDate, principal, rate) {
        
        let start = new Date(startDate);
        let end = new Date(endDate);
        
      
        let days = (end - start) / (1000 * 60 * 60 * 24);
        
       
        let T = days / 365;
        let n = 365; 
        
       
        let A = principal * Math.pow(1 + (rate / (100 * n)), n * T);
        let CI = A - principal; 
        
        return CI.toFixed(2); 
    }
    let allfixeds;
    await fetch('/api/fixed-deposit')
        .then(response => response.json())
        .then(data => {
            // console.log("Mutual Funds:", data);
            allfixeds = data;
        })
    .catch(error => console.error("Error fetching data:", error));
    let allmutuals;
    await fetch('/api/mutual-funds')
        .then(response => response.json())
        .then(data => {
            // console.log("Mutual Funds:", data);
            allmutuals = data;
        })
    .catch(error => console.error("Error fetching data:", error));
    let allBonds;
    await fetch('/api/bonds')
        .then(response => response.json())
        .then(data => {
            // console.log("Mutual Funds:", data);
            allBonds = data;
        })
    .catch(error => console.error("Error fetching data:", error));

    let investedCon = document.querySelector('#invested p')
    let currentCon = document.querySelector('#current p')
    let pnlCon = document.querySelector('#pnl p')
    let pnlconper = document.querySelector('#pnl span p')
    let assets = ['Mutual Funds','Stocks','Fixed Deposits','Bonds']
    let totalMutualVal = 0,totalFixedVal = 0
    let totalStockVal = 0,totalBondVal=0
    for(let key in allmutuals){
        let arr = allmutuals[key].investedAmount
        for(let i = 0;i<arr.length;i++){
           totalMutualVal += (Number)(arr[i]);
        }
    }
    for(let key in allfixeds){
        totalFixedVal += (Number)(allfixeds[key].fdInvestment)
    }
    for(let key in allBonds){
        totalBondVal += (Number)(allBonds[key].faceValue)
    }
    // console.log(totalMutualVal,(Number)(totalFixedVal),totalStockVal,totalBondVal);
    let currMutual = 0,currFixed = 0,currBond = 0;
    let totalVal = totalMutualVal+totalFixedVal+totalStockVal+totalBondVal
    let percentArr = [(totalMutualVal/totalVal)*100,(totalStockVal/totalVal)*100,(totalFixedVal/totalVal)*100,(totalBondVal/totalVal)*100]
    investedCon.innerHTML =  '-'
    currentCon.innerHTML = '-'
    pnlCon.innerHTML = '-'
     
    let allsum = []
    let allavgnav = []
    let allboughtUnits = []
    let alltotalUnits = []
    let allname = []
    for (let key in allmutuals) {
        // allmflist.innerHTML = "";
        let arr = allmutuals[key].investedAmount
        let arr2 = allmutuals[key].boughtUnits
        let arr3 = allmutuals[key].buyingDates
        let arr4 = allmutuals[key].assettClass
        let arr5 = allmutuals[key].navArr
        allname.push(allmutuals[key].fundName)
        // console.log(arr4)
        
        let temp = 0,temp2=0;
        for(let j = 0;j<arr.length;j++){
            let num = Number(arr[j])
            temp += num;
        }
        for(let j = 0;j<arr2.length;j++){
            let num = Number(arr2[j])
            temp2 += num;     
        }
        
       
        let avgnav = 0;
        let totalunits = 0;
        for(let j = 0;j<arr5.length;j++){
           totalunits += arr2[j];
           avgnav += arr2[j]*arr5[j]
        }
        // console.log(totalunits)
        alltotalUnits.push(totalunits);
        avgnav = avgnav/totalunits;
        allavgnav.push(avgnav);
        allsum.push(temp);
        allboughtUnits.push(temp2);
    }


    let recentnav = []
    for(let key in allmutuals){
        let code = allmutuals[key].fundCode
        
        try {
            const response = await fetch(`https://api.mfapi.in/mf/${code}`);
            const data = await response.json();
            recentnav.push(data.data[0].nav)     
        } catch (error) {
            console.error("Error fetching NAV:", error);
        }
    }

    let bestFunds = []
    let perreturn = []
    for(let j = 0;j<allsum.length;j++){
        let totalInvestment = allsum[j];
        let avgnav = allavgnav[j];
        let bought = allboughtUnits[j];
        let recent = recentnav[j]
        let per = ((recent-avgnav)*100)/avgnav
        perreturn.push(per);
    }
    for(let i = 0;i<allsum.length;i++){
        let x = ((100+perreturn[i])*allsum[i])/100
        currMutual = currMutual + x; 
        bestFunds.push({
            return : perreturn[i],
            name : allname[i],
            investedVal : allsum[i],
            currentVal : x
        })    
    }
    currMutual = parseFloat(currMutual.toFixed(2))
    
    
    let fixedval = []
    let interestRateArr = []
    let investedDates = []
    let fixedname = []
    let bondsVal = []
    let bondCouponRate = []
    let bondInvestmentDates = []
    let bondName = []
    for(let key in allfixeds){
        fixedval.push(allfixeds[key].fdInvestment)
        investedDates.push(allfixeds[key].date.split("T")[0])
        interestRateArr.push(allfixeds[key].interestRate)   
        fixedname.push(allfixeds[key].fdName)  
    }
    for(let key in allBonds){
        bondsVal.push(allBonds[key].faceValue)
        bondInvestmentDates.push(allBonds[key].date)
        bondCouponRate.push(allBonds[key].couponRate)
        bondName.push(allBonds[key].bondName)
    }
    for(let j = 0;j<fixedval.length;j++){
        let today = new Date().toISOString().split('T')[0]    
        let ci = calculateInterest(investedDates[j],today,fixedval[j],interestRateArr[j])
        currFixed += (fixedval[j]+(Number)(ci))
        bestFunds.push({
            return : interestRateArr[j],
            name : fixedname[j],
            investedVal : fixedval[j],
            currentVal : (fixedval[j]+(Number)(ci))
        })  
    }
    for(let j = 0;j<bondsVal.length;j++){
        let today = new Date().toISOString().split('T')[0]    
        let ci = calculateInterest(bondInvestmentDates[j],today,bondsVal[j],bondCouponRate[j])
        currBond += (bondsVal[j]+(Number)(ci))
        bestFunds.push({
            return : bondCouponRate[j],
            name : bondName[j],
            investedVal : bondsVal[j],
            currentVal : (bondsVal[j]+(Number)(ci))
        })     
    }
    bestFunds.sort((a, b) => b.return - a.return);
    console.log(bestFunds)
    console.log(currMutual)
    console.log(currFixed)
    investedCon.innerHTML =  `₹` + totalVal
    currentCon.innerHTML = `₹` + (currMutual+currFixed+currBond).toFixed(2)
    pnlCon.innerHTML = '₹' + (currMutual+currFixed+currBond-totalVal).toFixed(2)
    let returnper = ((currMutual+currFixed+currBond-totalVal)/totalVal)*100
 
    if(returnper < 0){
        document.querySelector('#pnl span svg').style.transform = 'rotate(180deg)'
        document.querySelector('#pnl span').style.color = '#f53149db'
    }
    pnlconper.innerHTML = returnper.toFixed(2)+'%'


    const ctx = document.getElementById('myPieChart').getContext('2d');


    let bestfundlist = document.getElementsByClassName('allmflist')[1]
    
    let mflistHTML = ''
    for(let i = 0;i<Math.min(bestFunds.length,10) ;i++){
        console.log(bestFunds[i])
    let str = bestFunds[i].name.slice(0,25);
    if(bestFunds[i].length > 30) str += ' ...'
    mflistHTML =  
    `
        <div class="mfcompo">
                                <div class="mflistfirst">
                                <span class="allmflistlogo"></span>
                                </div>
                                <div class="mflistsecond"> 
                                    <div class="mflistsecondone">${str}</div>
                                    <div class="mflistsecondtwo" style="font-weight: 400;">
                                        <span>Invested Amount : ${bestFunds[i].investedVal}</span>
                                        <span >Current Value : ${bestFunds[i].currentVal.toFixed(2)}</span>
                                    </div>
                                </div>
        </div>
    ` + mflistHTML
    }
    bestfundlist.innerHTML = mflistHTML;

    let newsResponse = await fetch('https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=5ZUJM65L9U6PAERD');
    let newsJSON = await newsResponse.json();
    console.log(newsJSON)
    let newscon = document.querySelector('.newz .allmflist')
    let x = `Error loading news`;
    if(newsJSON.feed){for(let i = 0;i<newsJSON.feed.length;i++){
        let newsbanner = newsJSON.feed[i].banner_image
        let title = newsJSON.feed[i].title.slice(0,44);
        let summary = newsJSON.feed[i].summary.slice(0,194);
        let author = newsJSON.feed[i].authors[0]
        let hypeurl = newsJSON.feed[i].url
        // console.log(hypeurl)
        let topicsArr = newsJSON.feed[i].topics
        let topics = ''
        topicsArr.forEach(topic => {
            topics += topic.topic
            topics += ', '
        });
        topics = topics.slice(0,45) + ' ...'
        // console.log(topics)
        x +=` <div class="card" onclick="window.open('${hypeurl}', '_blank');" >
        <div class="imgcon"  style="background: url('${newsbanner}'); background-size: 100% auto;
    background-position: center;
    background-repeat: no-repeat;"></div>
        <div class="card-content">
            <h2>${title}</h2>
            <p>${summary}</p>
            <p class="author">Author: ${author}</p>
            <p class="topics">Topics : ${topics}</p>
        </div>
        </div>`

    }}
    newscon.innerHTML = x;



    new Chart(ctx, {
        type: 'pie',
        data: {
            labels : assets,
            datasets: [{
                data: percentArr,
                backgroundColor: generateGreyShades(assets.length)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
  
   
   
});
