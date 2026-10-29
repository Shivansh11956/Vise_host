document.addEventListener('DOMContentLoaded', async function () {    
    loadData(); 
});
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
// document.addEventListener('DOMContentLoaded', async function () {    
//    loadData(); 
// });

async function loadData(){
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
    
    
    

    
    let addbtn = document.querySelector('#addbtn');
    let popup = document.querySelector(".popup");
    let container = document.querySelector('.container')
    let closebtn = document.querySelector('#closebtn svg')
    addbtn.addEventListener('click',()=>{
        popup.style.display = "block";
        container.classList.add("interact");
    })
    closebtn.addEventListener('click',()=>{
    popup.style.display = "none";
            
    container.classList.remove("interact");
    })
    
    // console.log(allmutuals);
    //Pie Chart Starting it is the mutual fund distribution
    let allmutuals;
    await fetch('/api/mutual-funds')
        .then(response => response.json())
        .then(data => {
            // console.log("Mutual Funds:", data);
            allmutuals = data;
        })
    .catch(error => console.error("Error fetching data:", error));
    // console.log(allmutuals[0])
    let allsum = [];
    let allmfnames = [];
    let allboughtUnits = [];
    let allavgnav = []
    let assettClassdisti = [0,0,0,0,0,0,0,0,0]
    let alltotalUnits = []
    let allmflist = document.querySelector('.allmflist');
    let mflistHTML = "";
    let netAsset = 0,currentAsset = 0;
    let netassetcon = document.querySelector('#invested p')
    let currentassetcon = document.querySelector('#current p')
    let pnlcon = document.querySelector('#pnl p')
    let pnlcon2 = document.querySelector('#pnl span p')
    let pnlcon3 = document.querySelector('#pnl span')
    let pnlcon4 = document.querySelector('#pnl span svg')
    for (let key in allmutuals) {
        // allmflist.innerHTML = "";
        let arr = allmutuals[key].investedAmount
        let arr2 = allmutuals[key].boughtUnits
        let arr3 = allmutuals[key].buyingDates
        let arr4 = allmutuals[key].assettClass
        let arr5 = allmutuals[key].navArr
        // console.log(arr4)
        allmfnames.push(allmutuals[key].fundName)
        let temp = 0,temp2=0;
        for(let j = 0;j<arr.length;j++){
            let num = Number(arr[j])
            temp += num;
        }
        for(let j = 0;j<arr2.length;j++){
            let num = Number(arr2[j])
            temp2 += num;     
        }
        
        for(let j = 0;j<arr4.length;j++){
            if(arr4[j] == 'Equity - Large Cap') assettClassdisti[0]++;
            if(arr4[j] == 'Equity - Mid Cap') assettClassdisti[1]++;
            if(arr4[j] == 'Equity - Small Cap') assettClassdisti[2]++;
            if(arr4[j] == 'Equity - Others') assettClassdisti[3]++;
            if(arr4[j] == 'Debt Fund') assettClassdisti[4]++;
            if(arr4[j] == 'Hybrid Fund') assettClassdisti[5]++;
            if(arr4[j] == 'Commodity Fund') assettClassdisti[6]++;
            if(arr4[j] == 'Real Estate Fund') assettClassdisti[7]++;
            if(arr4[j] == 'Others') assettClassdisti[8]++;
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
    // console.log(recentnav)
    // console.log(allavgnav)
    let assettsum = assettClassdisti.reduce((acc, num) => acc + num, 0);
    let assettper = [];
    for(let i = 0;i<assettClassdisti.length;i++){
            let x = assettClassdisti[i]/assettsum
            x = x*100;
            assettper.push(x);
    }
    
    // console.log(allmfnames)
    // console.log(allsum)
    // console.log(allboughtUnits)
    let totalAmount = allsum.reduce((acc, num) => acc + num, 0);
    let typeClass = ['Equity - Large Cap','Equity - Mid Cap','Equity - Small Cap','Equity - Others','Debt Fund','Hybrid Fund','Commodity Fund','Real Estate Fund','Others']
    
    let percentArr = []
    for(let i = 0;i<allsum.length;i++){
        let x = allsum[i]/totalAmount
        x=x*100
        percentArr.push(x)
        // console.log(x)
    }
    // console.log(percentArr)
    
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
        netAsset += allsum[i]
        currentAsset = currentAsset + ((100+perreturn[i])*allsum[i])/100;
        // console.log(currentAsset)
    }

    netAsset = parseFloat(netAsset.toFixed(2))
    currentAsset = parseFloat(currentAsset.toFixed(2))
    
    netassetcon.innerHTML = `₹` +  netAsset
    currentassetcon.innerHTML = '₹' + currentAsset
    pnlcon.innerHTML = '₹' + parseFloat((currentAsset-netAsset).toFixed(2))
    if(currentAsset - netAsset >= 0){
       pnlcon2.innerHTML = '+'
    }else{
       pnlcon2.innerHTML = '-'
       pnlcon3.style.color = '#eb7171'
       pnlcon4.style.transform = 'rotate(180deg)'
    }
    pnlcon2.innerHTML = ''
    pnlcon2.innerHTML += parseFloat((((currentAsset-netAsset)*100)/netAsset).toFixed(2)) + '%'
    console.log(allsum)
    console.log(perreturn)
    // let allmflist = document.querySelector('.allmflist');
    for(let i = 0;i<allsum.length;i++){
    let str = allmfnames[i].slice(0,25);
    if(allmfnames[i].length > 30) str += ' ...'
    mflistHTML =  
    `
        <div class="mfcompo">
                                <div class="mflistfirst">
                                <span class="allmflistlogo"></span>
                                </div>
                                <div class="mflistsecond"> 
                                    <div class="mflistsecondone">${str}</div>
                                    <div class="mflistsecondtwo" style="font-weight: 400;">
                                        <span>Invested Amount : ${allsum[i]}</span>
                                        <span >Accumulated Units : ${allboughtUnits[i].toFixed(2)}</span>
                                    </div>
                                </div>
        </div>
    ` + mflistHTML
    }
    allmflist.innerHTML = mflistHTML;
    let profitdiv = document.querySelector(".profits .allmflist")
    for(let j = 0;j<perreturn.length;j++){
        let tempper = perreturn[j].toFixed(2)
        let str = allmfnames[j].slice(0,30);
        if(allmfnames[j].length > 20) str += ' ...'
        let clr = "#2CEBBE";
        if(tempper < 0){
            clr = "#f53149db"
        }
        let x = `<div class="mfcompo">
                                <div class="mflistfirst">
                                <span class="allmflistlogo" style="background-color : ${clr};"></span>
                                </div>
                                <div class="mflistsecond pmflistsecond"> 
                                    <div class="mflistsecondone pmflistsecondone">${str}</div>
                                    <div class="mflistsecondtwo pmflistsecondtwo" style="font-weight: 400;">
                                        <span style = "color : ${clr};">${tempper} %</span>
                                    </div>
                                </div>
                            </div> `
        profitdiv.innerHTML = x + profitdiv.innerHTML
    }
    const ctx = document.getElementById('myPieChart').getContext('2d');
    const ctx2 = document.getElementById('pie2').getContext('2d')
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels : allmfnames,
            datasets: [{
                data: percentArr,
                backgroundColor: generateGreyShades(allmfnames.length)
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

    //// pie chart end

    new Chart(ctx2, {
        type: 'pie',
        data: {
            labels : typeClass,
            datasets: [{
                data: assettper,
                backgroundColor: generateGreyShades(typeClass.length)
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
}
