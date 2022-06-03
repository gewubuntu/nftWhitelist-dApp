import Head from 'next/head'
import styles from '../styles/Home.module.css'
import {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal"
import {Contract, providers} from "ethers";
import {abi, WHITELIST_CONTRACT_ADDRESS} from "../constants";


export default function Home() {
 // walletConnected keep track of wether the users wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
  const [joinedWhitelist, setJoinedWhiteList] = useState(false);
  //loading is set to true when waiting for transactions to get minted
  const [loading, setLoading] = useState(false);
  // numberOfWhitelisted tracks number of addresses whitelisted already
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // create a reference to web3 modal (used to connect to metamask) which persists
  // as long as the page is open
  const web3ModalRef = useRef();

  /**
   * Return a Provifder or Signer object representing the Ethereum RPC without the
   * signing capabilities of metamask attached
   *
   * A 'Provider' is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A 'Signer' is a special type of Provider used in case a 'write' transaction needs to be done on the blockchain,
   * which involves the connected account beeing able to sign/authorize the sent transaction. Metamask exposes a Signer API
   * to allow your website to request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */

  const getProviderOrSigner = async (needSigner = false) => {
    // connect to metamask
    // since we store 'web3Modal' as a reference, we need to access the 'current' value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // if user is not connected to rinkeby-net, throw error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change your Network to Rinkeby");
      throw new Error("Change your Network to Rinkeby");
    }

    if (needSigner) {
      return web3Provider.getSigner();
    }
    return web3Provider;
  }

  /**
   * addAddressToWhiteList: Adds the current connected address to the whitelist
   */
  const addAddressToWhitelist = async  () => {
    try {
      // need a signer since we want to write something to the blockchain
      const signer = await getProviderOrSigner(true);
      //create a new instance of the contract wit a signer, which allows to update methods
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
      );
      // call the addAddressToWhitelist from contract
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      // get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted();
      setJoinedWhiteList(true);
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * getNumberOfWhitelisted: gets the number of whitelisted addresses
   */
  const getNumberOfWhitelisted = async () => {
    try {
      // get Provider from web3modal, which in our case is MEtaMask
      // No need for the Signer, since we only read state of blockchain
      const provider = await getProviderOrSigner();
      // connect to contract using a provider => read-only access to contract
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          provider
      );
      // call the numAddressesWhitelisted from the contract
      const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * checkIfAddressInWhitelist: checks if address is whitelisted
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      // Signer needed to get users address
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
      );
      // get address associated to the signer which is connected to metamask
      const address = await signer.getAddress();
      // call the whitelistedAddresses from the Contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(address);
      setJoinedWhiteList(_joinedWhitelist)
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * connectWallet: Connects the metamask wallet
   */
  const connectWallet = async () => {
    try {
      //Get provider from web3Modal (metamask)
      // when used the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);

      await checkIfAddressInWhitelist();
      await getNumberOfWhitelisted();
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * renderButton:  Returns a button based on the state of the dapp
   */
  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
            <div className={styles.description}>
              Congratulations! You've acquired a slot in my NFT-Whitelist!
            </div>
        );
      } else if (loading) {
        return <button className={styles.button}> Loading . . .</button>
      } else {
        return (
            <button onClick={addAddressToWhitelist} className={styles.button}>
          Join the Whitelist!
        </button>
        );
      }
    } else {
      return (
          <button onClick={connectWallet} className={styles.button}>
            Connect your wallet
          </button>
      )
    }
  }

  //useEffects are used to react to changes of the website
  // the array at the end of a function call represents what state changes will trigger this effect
  // in this case, whenever the value of 'walletConnected' changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect metamask
    if (!walletConnected) {
      // assign Web3Modal class to reference object by setting its 'current' value
      //the 'current' value is persisted throughout as long as page is open
      web3ModalRef.current = new Web3Modal({
        network: 'rinkeby',
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
      <div>
        <Head>
          <title>Whitelist Dapp</title>
          <meta name="description" content="Whitelist-Dapp" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={styles.main}>
          <div>
            <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
            <div className={styles.description}>
              Its an NFT collection for developers in Crypto.
            </div>
            <div className={styles.description}>
              {numberOfWhitelisted} have already joined the Whitelist
            </div>
            {renderButton()}
          </div>
          <div>
            <img alt='ooops' className={styles.image} src="./crypto-devs.svg" />
          </div>
        </div>

        <footer className={styles.footer}>
          Made with &#10084; by Crypto Devs
        </footer>
      </div>
  );
}
