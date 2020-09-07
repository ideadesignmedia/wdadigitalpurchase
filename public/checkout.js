window.products = []
window.cartSelection = []
window.customer = {}
window.intent = ''
window.transfer = ''
window.api = ''
requestProducts = function(){
    return new Promise(res => {
        getData = function(page, cb) {
            var thereq = new XMLHttpRequest();
            thereq.open("GET", api + page, true);
            thereq.send();
            thereq.onreadystatechange = function(){
                if (this.readyState == 4) {
                    NewServerData = JSON.parse(thereq.responseText);
                    console.log(`NEW SERVER DATA = ${JSON.stringify(NewServerData)}`)
                    if (typeof cb === 'function') {
                        cb(NewServerData);
                    }
                }
            }
        }
        let cb = function(data) {
            if (data.error !== true) {
                products = data.products
                res(data)
            } else {
                res(null)
            }
        }
        getData('/products', cb);
    })
}
cartTotal = function(){
    if (cartSelection == null) {
        return 0
    } else {
        return cartSelection.length
    }
}
cartPrice = function(){
    console.log(cartTotal())
    if (cartTotal() < 1) {
        return 0
    } else {
        let total = 0
        cartSelection.forEach(item => {
            if (item) {
                let that = products.filter(prod => {
                    if (prod._id === item.product) {
                        return prod
                    }
                })
                if (that.length >= 1) {
                    total = total + (that[0].price * parseInt(item.quantity))
                }
            }
        })
        return total
    }
}
createCard = function(){
    let that = document.createElement('str-pay')
    document.querySelector('#cardbox').append(that);
}
getIntent = function(){
    return new Promise((res, rej) => {
        data = [
            {customer},
            {cartSelection}
        ]
        var serverreq = new XMLHttpRequest;
        serverreq.onreadystatechange = function(){
            if (this.readyState == 4) {
                NewServerData = JSON.parse(serverreq.responseText);
                console.log(`NEW SERVER DATA: ${JSON.stringify(NewServerData)}`)
                if (!data.error) {
                    window.transfer = NewServerData._id
                    return res(NewServerData.client_secret)
                } else {
                    return rej(data.message)
                }
            }
        }
        serverreq.open("POST", api + '/createintents', true);
        //x-www-form-urlencoded
        serverreq.setRequestHeader("Content-type", "application/json");
        console.log(`SENDING: ${JSON.stringify(data)}`)
        serverreq.send(JSON.stringify(data));
    })
}
manageOrder = function() {
    return new Promise((res, rej) => {
        data = {
            customer: customer
        }
        let cb = function(data){
            if (!data.error) {
                res(true);
            } else {
                rej(data.message)
            }
        }
        var serverreq = new XMLHttpRequest;
        serverreq.onreadystatechange = function(){
        if (this.readyState == 4) {
            NewServerData = JSON.parse(serverreq.responseText);
            console.log(JSON.stringify(NewServerData))
            if (typeof cb === 'function') {
                cb(NewServerData);
            }
        }
        }
        serverreq.open("POST", api + '/confirmpayments', true);
        serverreq.setRequestHeader("Content-type", "application/json");
        if (data == null) {
            rej('ERROR PROCESSING DATA')
        } else {
            serverreq.send(JSON.stringify(data));
        }
    })
}
class Products extends HTMLElement {
    constructor(){
        super()
        this.shadow = this.attachShadow({mode:'open'})
        this.addCart = (e) => {
            e.preventDefault()
            e.stopPropagation()
            let select = null
            let s = products.filter(prod => { 
                if (prod._id === e.target.parentElement.id) {
                    if (!select) {
                        select = {product: prod._id, quantity: 1}
                    }
                    return prod
                }
            })
            console.log(`ADDING ${JSON.stringify(select)}`)
            if (!select) {
                throw new Error(`Could not select ${e.target.parentElement.id} was not in list possibly.`)
            }
            cartSelection.push(select)
            e.target.innerHTML = 'REMOVE'
            e.target.removeEventListener('click', this.addCart)
            e.target.addEventListener('click', this.removeCart)
            document.querySelector('checkout-div').shadow.querySelector('#gotoorder').innerHTML = `CONFIRM TOTAL: $${cartPrice() || '0'}`
            console.log(JSON.stringify(cartSelection.length))
        }
        this.removeCart = (e) => {
            e.preventDefault()
            e.stopPropagation()
            const o = e.target.parentElement.id
            console.log(o)
            let ice = 0
            if (cartSelection.length < 2) {
                cartSelection = []
            } else {
                cartSelection = cartSelection.filter(item => {if (item.product !== o) {console.log(`removing ${JSON.stringify(item)}`); return item}})
            }
            e.target.innerHTML = 'ADD'
            e.target.removeEventListener('click', this.removeCart)
            e.target.addEventListener('click', this.addCart)
            console.log(JSON.stringify(cartSelection))
            document.querySelector('checkout-div').shadow.querySelector('#gotoorder').innerHTML = `CONFIRM TOTAL: $${cartPrice() || '0'}`
        }
    }
    loadLiteral(elem, data, literal) {
        if (elem == null || data == null || typeof literal !== 'function') {
            throw new Error('CANNOT LOAD LITERAL FROM ' + `${elem}, ${data}, ${literal}. Please ensure that you are entering an element, an array of data and a template literal generator`)
        } else {
            data.forEach(item => {
                elem.innerHTML = elem.innerHTML + literal(item)
            })
        }
    }
    temp(prod){
        if (cartSelection.includes(prod)) {
            return `<div class="product" id="${prod._id}">
            <h2>${prod.name}</h2>
            <span>$${prod.price}</span>
            <p>${prod.description}</p>
            <button class="remove">REMOVE</div>
        </div>`
        } else {
            return `<div class="product" id="${prod._id}">
            <h2>${prod.name}</h2>
            <span>$${prod.price}</span>
            <p>${prod.description}</p>
            <button class="add">ADD</div>
            </div>`
        }
    }
    render(){
        this.shadow.innerHTML = `<style>
            #cont {
                max-width: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                max-height: 100%;
                overflow-x: hidden;
                overflow-y: scroll;
                display: grid;
                grid-template-columns: 1fr;
            }
            h2 {
                font-weight: 800;
                font-size: 1.4rem;
                margin: 0;
                padding: 5px 10px;
                max-width: 100%;
                cursor: default;
            }
            span {
                font-size: 1.2rem;
                color: var(--prim);
                font-weight: 800;
                cursor: default;
                max-width: 100%;
                padding: 5px 10px;
                margin: 0;
                cursor: default;
            }
            p {
                font-size: 1rem;
                color: var(--light);
                font-weight: 400;
                max-width: 100%;
                padding: 10px 20px;
                margin: 0;
                cursor: default;
            }
            #cont::-webkit-scrollbar {
                display: none;
            }
            .product {
                max-width: 100%;
                width: 100%;
                margin: 0;
                padding: 10px 0px;
                display: inline-flex;
                flex-direction: column;
                align-items; cent
            }
            button {
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 50px;
                font-weight: 800;
                background-color: var(--dark);
                color: var(--prim);
                transition: 300ms ease-in;
                text-align: center;
                max-width: 100%;
                font-size: 1.2rem;
                text-shadow: 1px 2px 3px #00000060;
            }
            button:hover {
                transition: 250ms ease-out;
                letter-spacing: 2px;
                background-color: var(--second);
                color: var(--light);
            }
        </style>
        <div id="cont">
        
        </div>`
        if (window.products.length > 0) {
            this.loadLiteral(this.shadow.querySelector('#cont'), window.products, this.temp)
            Array.from(this.shadow.querySelectorAll('.add')).forEach(a => a.addEventListener('click', this.addCart))
            Array.from(this.shadow.querySelectorAll('.remove')).forEach(r => r.addEventListener('click', this.removeCart))
        } else {
            this.shadow.querySelector('#cont').innerHTML = '<span>NO PRODUCTS YET</span>'
        }
    }
    connectedCallback(){
        this.render()
    }
}
customElements.define('product-div', Products)
class Checkout extends HTMLElement {
    constructor(){
        super();
        this.shadow = this.attachShadow({mode:"open"})
    }
    render(){
        this.shadow.innerHTML = `<style>
        .hidden {
            display: none!important;
        }
        #CO {
            width: 100%;
            height: auto;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 5px;
            border-bottom-right-radius: 0px;
            border-bottom-left-radius: 0px;
            box-shadow: 0px -2px 3px var(--prim);
        }
        .COi {
            width: 100%;
            max-width: 100%;
            margin: 20px 0px;
            display: inline-flex;
            align-items: center;
            justify-content: space-around;
            background-color: var(--light);
            color: var(--dark);
        }
        .cRemove {
            background: linear-gradient(5deg, var(--dark), rgba(198,146,84,1));
            padding: 10px;
            border-radius: 5px;
            color: var(--light);
            box-shadow: 1px 1px 3px rgba(0,5,4,.75);
            cursor: pointer;
            transition: 200ms;
        }
        .cRemove:hover {
            transform: scale(1.1,1.1);
        }
        .coName {
            text-transform: uppercase;
            font-size: 1.2rem;
        }
        .coPrice {
            font-family: mr-eaves-mod;
            font-size: 1.2rem;
        }
        img {
            box-shadow: 1px 1px 3px rgba(0,5,4,.75);
        }
        #gotoorder {
            max-width: 100%;
            width: 100%;
            box-shadow: 2px 2px 2px rgba(0,5,4,.8);
            text-shadow: 0px -2px 5px rgba(214,126,30,.5);
            background: linear-gradient(5deg, var(--dark), var(--prim));
            padding: 10px 0px;
            margin: 0;
            border-radius: 5px;
            border-bottom-right-radius: 0px;
            border-bottom-left-radius: 0px;
            cursor: pointer;
            transition: 300ms;
            text-align: center;
            font-weight: 800;
            color: var(--light);
        }
        #gotoorder:hover {
            color: inherit;
            transition: 200ms ease;
            letter-spacing: 3px;
            color: var(--light);
            text-shadow: 1px 2px 2px #00000040;
            background: linear-gradient(5deg, var(--second), var(--dark));
        }
        form {
            width: auto;
            height: auto;
            max-width: 100%;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(5deg, var(--dark), var(--second));
            box-shadow: 2px 2px 2px rgba(0,5,4,.8);
        }
        .formhead {
            font-size: 1.4rem;
            text-align: center;
            padding: 10px;
            font-weight: 800;
            cursor: default;
            text-shadow: 1px 2px 2px #00000060;
        }
        label {
            margin-top: 10px;
            font-weight: 800;
            font-size: 1rem;
        }
        input {
            margin-bottom: 5px;
            font-size: 1.3rem;
            text-align: center;
            font-weight: 800;
            background-color: var(--light);
        }
        #choice {
            width: 100%;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            background: linear-gradient(5deg, var(--dark), var(--prim));
            box-shadow: 2px 2px 2px rgba(0,5,4,.8);
        }
        #pickup {
            margin: 20px;
            background: linear-gradient(5deg, var(--dark), rgba(198,146,84,1));
            padding: 10px;
            border-radius: 5px;
            box-shadow: 1px 1px 3px rgba(214,126,30,.75);
            cursor: pointer;
            transition: 300ms ease;
        }
        #ship {
            margin: 20px;
            background: linear-gradient(5deg, var(--dark), rgba(198,146,84,1));
            padding: 10px;
            border-radius: 5px;
            box-shadow: 1px 1px 3px rgba(214,126,30,.75);
            cursor: pointer;
            transition: 300ms ease;
        }
        #ship:hover {
            transform: scale(1.1,1.1);
            transition: 300ms ease;
        }
        #pickup:hover {
            transform: scale(1.1,1.1);
            transition: 300ms ease;
        }
        #backtoinfo {
            font-size: 1.2rem;
            margin-right: 20px;
        }
        .opts {
            display: inline-flex;
            align-items: center;
            justify-content: space-around;
        }
        #subBut {
            margin: 10px;
            padding: 10px 15px;
            border-radius: 50px;
            box-shadow: 1px 2px 3px #00000040;
            text-shadow: 1px 1px 2px #00000060;
            color: var(--prim);
            background-color: var(--dark);
            cursor: pointer;
            transition: 300ms ease-in;
        }
        #subBut:hover {
            transition: 200ms ease-out;
            background-color: var(--second);
            color: var(--light);
            letter-spacing: 2px;
        }
        #complete {
            max-width: 100%;
            font-weight: 800;
            font-size: 1.4rem;
            word-break: break-word;
            color: var(--prim);
            text-align: center;
        }
        </style>
        <div id="CO">
            <div id="COH"><product-div></product-div></div>
            <div id="gotoorder">CONFIRM TOTAL: $${cartPrice() || '0'}</div>
            <div id="COC" class="hidden">
                <form id="COCf">
                    <div class="formhead">PLEASE ENTER YOUR INFO</div>
                    <div id="COCfw" class="formwarn"></div>
                    <label for="firstName">First Name</label>
                    <input name="firstName">
                    <label for="lastName">Last Name</label>
                    <input name="lastName">
                    <label for="email">Email</label>
                    <input name="email">
                    <input type="submit" id="subBut" value="NEXT">
                </form>
            </div>
            <div id="COA" class="hidden">
                <div id="choice" class="hidden"><div id="pickup" class="hidden">PICK UP</div><div id="ship">DELIVER TO ME</div></div>
                <form id="COAf">
                    <div class="formhead">PLEASE ENTER YOUR ADDRESS</div>
                    <div id="COAfw" class="formwarn"></div>
                    <label for="street">Street Address</label>
                    <input type="text" name="street">
                    <label for="city">City</label>
                    <input type="text" name="city">
                    <label for="State">State(AZ ONLY)</label>
                    <select name="state"><option value="AZ">ARIZONA</option></select>
                    <label for="zipcode">Zipcode</label>
                    <input type="text" name="zipcode">
                    <div class="opts">
                    <div id="backtoinfo">BACK</div>
                    <input type="submit" value="NEXT">
                    </div>
                </form>
                <div id="PU" class="hidden">PICK UP, WE WILL SEND YOU A PROOF OF PURCHASE ONCE YOUR PAYMENT HAS BEEN PROCESSED.</div>
            </div>
            <div id="complete" class="hidden">ORDER COMPLETED REDIRECTING TO LANDING PAGE</div>
        </div>`
        const custform = this.shadow.querySelector('#COCf');
        const adform = this.shadow.querySelector('#COAf');
        const conftotal = this.shadow.querySelector('#gotoorder');
        const choice = this.shadow.querySelector('#choice')
        const bti = this.shadow.querySelector('#backtoinfo')
        bti.addEventListener('click', () => {
            this.shadow.querySelector('#COC').classList.remove('hidden')
            this.shadow.querySelector('#choice').classList.remove('hidden')
            this.shadow.querySelector('#COAf').className = 'hidden'
            this.shadow.querySelector('#COA').className = 'hidden'
        })
        conftotal.addEventListener('click', function(){
            if (cartPrice() > 0) {
                this.className = 'hidden'
                let that = document.querySelector('checkout-div').shadowRoot
                that.querySelector('product-div').remove()
                that.getElementById('COH').className = 'hidden'
                that.getElementById('COC').classList.remove('hidden');
            } else {
                this.innerHTML = 'PLEASE SELECT SOME PRODUCTS!'
                setTimeout(() => {
                    this.innerHTML = `<div id="gotoorder">CONFIRM TOTAL: $${cartPrice()}</div>`
                },2000)
            }

        })
        custform.addEventListener('submit', function(e){
            e.preventDefault();
            e.stopPropagation()
            const warn = this.querySelector('#COCfw')
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this['email'].value)) return warn.innerHTML = 'Please enter a valid email address. It is important that we are able to send your order confirmation.'
            customer['firstName'] = this['firstName'].value
            customer['lastName'] = this['lastName'].value
            customer['email'] = this['email'].value
            this.parentElement.className = 'hidden'
            let that = document.querySelector('checkout-div').shadowRoot
            if (that.address) {
                that.getElementById('COA').classList.remove('hidden')
            } else {
                getIntent().then(result => {
                    console.log(result)
                    document.querySelector('checkout-div').shadowRoot.getElementById('COA').className = 'hidden'
                    createCard()
                    intent = result
                }).catch(e => {
                    console.log(e)
                    that.shadow.getElementById('PU').innerHTML = e
                })
            }

        })
        choice.addEventListener('click', (e) => {
            if (e.target.id === 'pickup') {
                this.shadow.getElementById('choice').className = 'hidden'
                this.shadow.getElementById('PU').classList.remove('hidden');
                this.getIntent().then(result => {
                    this.shadow.getElementById('COA').className = 'hidden'
                    createCard()
                    intent = result
                }).catch(e => {
                    console.log(e)
                    this.shadow.getElementById('PU').innerHTML = e
                })
            } else if (e.target.id === 'ship') {
                this.shadow.getElementById('choice').className = 'hidden'
                this.shadow.getElementById('COAf').classList.remove('hidden');
            }
        })
        adform.addEventListener('submit', function(e){
            e.preventDefault()
            e.stopPropagation()
            if (this['state'].value !== 'AZ') {
                console.log('state changed on form')
            } else if (!this['zipcode'].value || !this['street'].value || !this['city'].value) {
                console.log('invalid info in form')
            } else {
                customer['address'] = {
                    street: this['street'].value,
                    city: this['city'].value,
                    state: 'AZ',
                    zipcode: this['zipcode'].value
                }
                getIntent().then(result => {
                    console.log(result)
                    document.querySelector('checkout-div').shadowRoot.getElementById('COA').className = 'hidden'
                    let that = document.querySelector('navi-bar').shadowRoot
                    that.querySelector('#bts').className = 'hidden'
                    that.querySelector('#btsc').classList.remove('hidden');
                    createCard()
                    intent = result
                }).catch(e => {
                    console.log(e)
                })
            }
        })
    }
    connectedCallback(){
        window.check = this
        this.render()
    }
    static get observedAttributes(){
        return ['render']
    }
    attributeChangedCallback(n){
        if (n === 'render') this.render()
    }
}
window.customElements.define('checkout-div', Checkout);
window.card = null
createCard = function(){
    let that = document.createElement('str-pay')
    document.querySelector('body').append(that);
}
class sPay extends HTMLElement {
    constructor(){
        super();
        let style = {
            base: {
                color: "#32325d",
              }
        }
        if (!card) {
            card = elements.create("card", { style: style });
        }
    }
    loadLiteral(elem, data, literal) {
        if (elem == null || data == null || typeof literal !== 'function') {
            throw new Error('CANNOT LOAD LITERAL FROM ' + `${elem}, ${data}, ${literal}. Please ensure that you are entering an element, an array of data and a template literal generator`)
        } else {
            data.forEach(item => {
                elem.innerHTML = elem.innerHTML + literal(item)
            })
        }
    }
    connectedCallback(){
        this.innerHTML = `<style>
        #submit {
            max-width: 100%;
            padding: 10px 20px;
            margin-top: 20px;
            border-radius: 50px;
            color: var(--light);
            background: linear-gradient(0deg, var(--dark), var(--prim));
            box-shadow: 2px 2px 4px rgba(198,146,84,.5);
            text-shadow: 1px 1px 3px rgba(198,146,84,.75);
            font-size: 1.5rem;
            transition: 400ms ease-in;
            cursor: pointer;
        }
        #submit:hover {
            transition: 300ms ease-out;
            letter-spacing: 2px;
            color: var(--light);
            background: linear-gradient(0deg, var(--second), var(--dark));
        }
        #paymentHeader {
            font-size: 1.2rem;
            color: var(--dark);
            text-shadow: 1px 2px 1px rbga(0,0,0,.7);
            cursor: default;
            font-weight: 800;
            margin-bottom: 15px;
        }
        #paymentHeader::-webkit-scrollbar {
            display: none;
        }
        #selected::-webkit-scrollbar {
            display: none;
        }
        #yours {
            font-weight: 800;
            cursor: default;
        }
        #total {
            font-weight: 400;
            margin-top: 3px;
            color: var(--prim);
            text-shadow: 1px 0px 1px var(--prim);
            padding: 5px 10px;
            font-size: .9rem;
            max-width: 100%;
            border-radius: 50px;
            background-color: var(--dark);
            cursor: default;
        }
        #paymentFooter {
            max-width: 100%;
            text-align: right;
            overflow: hidden;
            padding-right; 10px;
            margin-right: 10px;
            color: var(--dark);
            padding: 7px 0px;
            font-weight: 800;
            cursor: default;
            font-size: .8rem;
        }
        #selected {
            max-width: 100%;
            padding: 10px;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow-x: hidden;
            overflow-y: scroll;
        }
        .prod {
            max-width: 100%;
            text-align: center;
            padding: 5px 10px;
            font-weight: 400;
            font-size: 1rem;
            border: 2px solid var(--dark);
            cursor: default;
        }
        #payment-form {
            max-width: 100%;
            padding: 5px 15px;
        }
        #card-element {
            border: 2px solid var(--prim);
            border-radius: 5px;
        }
        #prods {
            max-width: 100%;
            overflow-x: hidden;
            overflow-y: scroll;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--dark);
        }
        #prods::-webkit-scrollbar {
            display: none;
        }
        @media screen and (min-width: 1080px) {
            #card-element {
                max-width: 49%;
                transform: translateX(33%);
            }
        }
        </style>
        <div id="sPay">
        <div id="selected"><div id="yours">Your Products:</div><div id="prods"></div><div id="total">TAX: $0.00 TOTAL: $${cartPrice()}.00</div></div>
        <div id="paymentHeader">PLEASE ENTER YOUR CARD INFORMATION BELOW</div>
        <form id="payment-form">
          <div id="card-element"></div>
          <div id="card-errors" role="alert"></div>
          <button id="submit">Pay</button>
        </form>
        <div id="paymentFooter">Payments Powered by Stripe™</div>
      </div>`
      let temp = (prod) => {
          let product = products.filter(product => {if (product._id === prod.product) return product})[0]
          console.log(product)
          return `<div class="prod" id="${product._id}">Name: ${product.name} Price: $${product.price}.00 Quantity: ${prod.quantity}</div>`
      }
      this.loadLiteral(this.querySelector('#prods'), cartSelection, temp)
      card.mount(document.querySelector('#card-element'));
      card.addEventListener('change', ({error}) => {
        const displayError = document.getElementById('card-errors');
        if (error) {
          displayError.textContent = error.message;
        } else {
          displayError.textContent = '';
        }
      });
      var form = document.querySelector('#payment-form');
      form.addEventListener('submit', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        let warn = this.querySelector('#card-errors')
        stripe.handleCardPayment(intent, card, {
          payment_method_data: {
            billing_details: {
              name: `${customer.firstName} ${customer.lastName}`
            }
          }
        }).then(function(result) {
          if (result.error) {
            warn.innerHTML = result.error.message
            console.log(result.error.message);
          } else {
                if (result.paymentIntent.status === 'succeeded') {
                    console.log('PAYMENT SUCCEESS!')
                    let o
                    let p = products.filter(prod => { if (prod.name === 'Digital Download') return prod._id})
                    if (cartSelection.map(item => {return item.product}).includes(p[0]._id)) {
                        console.log('is digital')
                        o = true
                    }
                    manageOrder().then(complete => {
                        if (complete === true) {
                            cartSelection = []
                            sessionStorage.removeItem('cart')
                            if (o) {
                                setTimeout(()=>{
                                    window.location = '/download' + `?${transfer}`
                                }, 3000)
                                setTimeout(() => {
                                    document.querySelector('checkout-div').shadowRoot.getElementById('complete').innerHTML = `REDIRECTING TO DOWNLOAD`
                                }, 1500)
                            } else {
                                setTimeout(() => {
                                   window.location = 'https://wagnerdancearts.com'
                                }, 3000)
                                setTimeout(() => {
                                    document.querySelector('checkout-div').shadowRoot.getElementById('complete').innerHTML = `REDIRECTING TO WEBSITE`
                                }, 1500)
                            }
                            document.querySelector('str-pay').className = 'hidden'
                            document.querySelector('checkout-div').shadowRoot.getElementById('complete').classList.remove('hidden')
                            setTimeout(()=> {
                                document.querySelector('checkout-div').shadowRoot.getElementById('complete').innerHTML = `PLEASE CHECK YOUR EMAIL FOR YOUR ORDER CONFIRMATION`
                            }, 750)
                        } else {
                            document.querySelector('checkout-div').shadowRoot.getElementById('complete').innerHTML = `YOUR PAYMENT WAS PROCESSED HOWEVER THERE WAS AN ISSUE UPDATING YOUR ORDER. IF YOU DO NOT RECEIVE AN EMAIL PLEASE CALL US.`
                        }
                    })
                } else {
                    console.log(result)
                }
            }
        }).catch(e => {
            console.log(e);
        })
        });
    }
}
window.customElements.define('str-pay', sPay);