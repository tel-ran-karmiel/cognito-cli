import "dotenv/config"
import logger from "./logger.ts"
import readline from "node:readline/promises"
import {InitiateAuthCommand, RespondToAuthChallengeCommand,
     CognitoIdentityProviderClient, AuthenticationResultType,
    InitiateAuthCommandOutput} from "@aws-sdk/client-cognito-identity-provider"
const{region, clientId} = getRegionClientId()
async function main() {
    const cli: readline.Interface = readline.createInterface({input: process.stdin, output: process.stdout})
    const {username, password} = getUsernamePassword(cli)
    const client = new CognitoIdentityProviderClient({})
    const resp: InitiateAuthCommandOutput = initialAuthentication(client, username, password)
    if(resp.AuthenticationResult){
        printTokens(resp.AuthenticationResult);
    } else {
        const newPassword = getNewPassword(cli)
        const resp2: InitiateAuthCommandOutput = respondAuthentication(resp, client, username, newPassword)
        printTokens(resp2.AuthenticationResult)
    }
}
main().catch(err => {
    const errorMessage = err.message;
    console.error(err.$fault==="client" ? "client error: " : "server error: " + errorMessage)
})