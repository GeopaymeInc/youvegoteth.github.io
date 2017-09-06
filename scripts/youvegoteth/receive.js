
window.onload = function () {

        setTimeout(function(){
            $("loading").style.display = "none";
            if(!web3.currentProvider.isMetaMask){
                $("step_zero").style.display = "block";
            } else {
                $("send_eth").style.display = "block";
            }
        },1000);


        if(!getParam('key')){
            $("send_eth").innerHTML = "<h1>Error 🤖</h1> Invalid Link.  Please check your link and try again" ;
            return;
        }

    //default form values
    $("private_key").value = getParam('key');
    var token = getParam('token');
    if(!token){
        token = 'ETH';
    }
    var _text = "You've Got "+getParam('amount')+" "+getWarning()+" "+token+"!";
    $("zeroh1").innerHTML = _text;
    $("oneh1").innerHTML = _text;
    $("tokenName").innerHTML = token;

    // When 'Generate Account' is clicked
    $("receive").onclick = function() {
        metaMaskWarning();

        //get form data
        var private_key = $("private_key").value;
        var _idx = '0x' + lightwallet.keystore._computeAddressFromPrivKey(private_key);
        var forwarding_address = $("forwarding_address").value.trim();

        if(!forwarding_address || forwarding_address == '0x0'){
            _alert("Not a valid forwarding address.");
            return;
        }

        if(!_idx || _idx == '0x0'){
            _alert("Invalid Link.  Please check your link and try again");
            return;
        }
        if(!private_key){
            _alert("Invalid Link.  Please check your link and try again");
            return;
        }

        //set up callback to sendRawTransaction
        var callback = function(error, result){
            if(error){
                console.log(error);
                _alert('got an error :(');
            } else {
                startConfetti();
                $("send_eth").innerHTML = "<h1>Success 🚀!</h1> <a href='https://"+etherscanDomain+"/tx/"+result+"'>See your transaction on the blockchain here</a>.<br><br>It might take a few minutes to show up, depending upon: <br> - network congestion<br> - network fees that sender allocated to transaction<br>" ;
            }
        };

        //find the nonce
        web3.eth.getTransactionCount(_idx,function(error,result){
            var nonce = result;
            if(!nonce){
                nonce = 0;
            }
            web3.eth.getBalance(_idx, function(error,result){
                var balance = result.toNumber();
                if(balance==0){
                    _alert("You must wait until the senders transaction confirms.");
                    return;
                }
                web3.eth.getBlock("latest", function(error,result){
                    var gasLimit = result.gasLimit;
                    contract().claimTransfer.estimateGas(_idx, forwarding_address,function(error,result1){

                        //setup raw transaction
                        var data = contract().claimTransfer.getData(_idx, forwarding_address);
                        var payloadData = data; //??
                        var fromAccount = _idx; //???
                        var gas = balance - 1;
                        if(gas > maxGas){
                            gas = maxGas;
                        }
                        gasLimit = gas + 1;
                        var rawTx = {
                            nonce: web3.toHex(nonce),
                            gasPrice: web3.toHex(1),
                            gasLimit: web3.toHex(gasLimit),
                            gas: web3.toHex(gas),
                            to: contract_address,
                            from: fromAccount,
                            value: '0x00',
                            data: payloadData,
                        };
                        
                        //sign & serialize raw transaction
                        var tx = new EthJS.Tx(rawTx);
                        tx.sign(new EthJS.Buffer.Buffer.from(private_key, 'hex'));
                        var serializedTx = tx.serialize();

                        //send raw transaction
                        web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), callback);

                    });
                });
            });
        });
    };
};
