require('dotenv').config()
const xlsx = require('xlsx')
const ObjectsToCsv = require('objects-to-csv')
const cpto = require('crypto')
var xmlreq = require("xmlhttprequest").XMLHttpRequest;

///////////////////////FUNCTION DEFINITIONS///////////////////////////////////

//FUNCTION SENDS REQUEST TO BINANCE ACCOUNT AND RETRIEVES ALL ITS ASSETS
//WITH HTTP REQUEST

//AFTER REQ IS RECIEVED RUNS getRates FUNCTION IN ASYNC 
const getBinance = () => {
    const burl = 'https://api.binance.com'
    const endPoint = '/api/v3/account'
    const dataQueryString = 'recvWindow=20000&timestamp=' + Date.now()
    const skey = process.env.B_SEC
    const pkey = process.env.B_KEY

    const signature = cpto.createHmac('sha256', skey).update(dataQueryString).digest('hex');

    var ourReq = new xmlreq();

    const url = burl + endPoint + '?' + dataQueryString + '&signature=' + signature

    ourReq.open('GET', url, true)
    ourReq.setRequestHeader('X-MBX-APIKEY', pkey)

    ourReq.onload = async () => {
        var ourData = JSON.parse(ourReq.responseText);
        const formattedData = ourData.balances.filter(a => parseFloat(a.free) != 0.0)

        console.log("Current crypto assets:")
        console.log(formattedData)
        getRates(formattedData)
        
    }

    console.log('Sending BINANCE request for assets...')
    ourReq.send()

}

//FUNCTION SENDS REQUEST TO FOR CRYPTO EXCHANGE RATES 
//TAKES AS INPUT CURRENT ASSETS
//WITH HTTP REQUEST

//IT ALSO WRITES DOWN THE RETRIEVED DATA INTO EXCEL FILE finances.xlsx
const getRates = (inData) => {

    const sym = inData.map(item => item.asset)

    //key and base url
    const key = process.env.CRYPTO_COMPARE
    const burl = 'https://min-api.cryptocompare.com/data/pricemulti'

    //what currency to display exchange in (current euro)
    const valueUrl = 'tsyms=EUR'

    //create sub-url for symbols to look up
    const symUrl = `fsyms=${sym.toString()}`

    //key url
    const kUrl = 'api_key=' + key

    //create final url
    const url = burl + '?' + symUrl + '&' + valueUrl + '&' + kUrl

    //create requests and send them for each
    
    var req = new xmlreq();

    req.open('GET', url, true)

    req.onload = async () => {
        const reqData = JSON.parse(req.responseText)

        console.log('Current exchange rates to EUR:')
        console.log(reqData)
        //reformat data to array of objects with [{asset, rate},...] form
        const dataArray = inData.map(item => (
            Object.assign(item, {rate : reqData[item.asset].EUR, current_value : reqData[item.asset].EUR * item.free } )
        ))

        //WRITE INFO TO EXCEL
        var wb = xlsx.readFile('finances.xlsx')
        wb.Sheets['crypto'] = xlsx.utils.json_to_sheet(dataArray)
        xlsx.writeFile(wb, 'finances.xlsx')
    }
    console.log('sending rates request...' + '\n')
    req.send()
}





///////////////////////RUNTIME///////////////////////////////////
getBinance()
