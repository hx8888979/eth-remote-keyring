import EventEmitter from "events";
import { Request } from "./request";

const type = "Remote Key Pair"

interface SerializedRemoteKeyring {
    url: string;
}

class RemoteKeyring extends EventEmitter {
    static readonly type: string = type;

    readonly type: string = type;
    pendingDeletion: string[];
    url: string | undefined;
    request: Request | undefined;
    accountsCache: string[] | undefined;


    constructor(opts: SerializedRemoteKeyring) {
        super();
        this.pendingDeletion = [];
        this.deserialize(opts || {});
    }

    async serialize(): Promise<SerializedRemoteKeyring> {
        return { url: this.url || "" };
    }

    async deserialize(config: SerializedRemoteKeyring) {
        if (!!config.url && config.url.length > 0) {
            this.request = new Request(config.url);
            this.url = config.url;
        }
    }

    async addAccounts(n = 1) {
        this.accountsCache = undefined;
        const hexWallets = await this.request?.request({ method: "addAccounts", parameters: [n] });
        return hexWallets;
    }

    async getAccounts() {
        if (!!this.pendingDeletion) {
            if (this.pendingDeletion.length === 1 && this.accountsCache?.length === 1 && this.accountsCache[0] === this.pendingDeletion[0]) {
                return [];
            }
            for (const account of this.pendingDeletion) {
                await this.request?.request({ method: "removeAccount", parameters: [account] });
            }
            this.pendingDeletion = [];
            this.accountsCache = undefined;
        }

        if (this.accountsCache != undefined) {
            return this.accountsCache;
        }
        const accounts = await this.request?.request({ method: "getAccounts" }) as string[];
        this.accountsCache = accounts;
        return accounts || [];
    }

    // tx is an instance of the ethereumjs-transaction class.
    async signTransaction(address: string, tx: any, opts = {}) {
        const serializedTX = tx.serialize().toString('hex');
        const serializedsignedTx: string = await this.request?.request({ method: "signTransaction", parameters: [address, serializedTX, opts] }) as string;
        const signedTx = tx.constructor.fromSerializedTx(Buffer.from(serializedsignedTx, 'hex'));
        // Newer versions of Ethereumjs-tx are immutable and return a new tx object
        return signedTx;
    }

    async signPersonalMessage(address: string, data: string) {
        const signedMessage = await this.request?.request({ method: "signPersonalMessage", parameters: [address, data] });
        return signedMessage;
    }

    // For eth_sign, we need to sign arbitrary data:
    async signMessage(address: string, data: any, opts = {}) {
        const rawMsgSig = await this.request?.request({ method: "signMessage", parameters: [address, data, opts] });
        return rawMsgSig;
    }

    // exportAccount should return a hex-encoded private key:
    async exportAccount() {
        return 'EXPORT NOT ALLOWED';
    }

    removeAccount(address: string) {
        this.pendingDeletion = [...this.pendingDeletion, address];
    }
}

// async function test() {
//     const test = new RemoteKeyring({ url: "ws://localhost:8080" });
//     const accounts = await test.getAccounts();
//     console.log(accounts);
// }

// async function test() {
//     const test = new RemoteKeyring({ url: "ws://localhost:8080" });
//     const accounts = await test.addAccounts(2);
//     console.log(accounts);
// }

// async function test() {
//     const test = new RemoteKeyring({ url: "ws://localhost:8080" });
//     const signedMessage = await test.signMessage("0xd861425adcb42eb69e1ecfbb5d049ae2b2a4f14b", "d861425adcb42eb69e1ecfbb5d049ae2b2a4f14bd861425adcb42eb69e1ecfbb");
//     console.log(signedMessage);
// }

// test().catch((err) => console.error(err));

export = RemoteKeyring;