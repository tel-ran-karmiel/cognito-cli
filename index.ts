import "dotenv/config"
import logger from "./logger.ts"
import readline from "node:readline/promises"
import {InitiateAuthCommand, RespondToAuthChallengeCommand,
     CognitoIdentityProviderClient, AuthenticationResultType,
    InitiateAuthCommandOutput} from "@aws-sdk/client-cognito-identity-provider"
    const N_UNDERSCIRES = 100
const{region, clientId} = getRegionClientId()
async function main() {
    const cli: readline.Interface = readline.createInterface({input: process.stdin, output: process.stdout})
   try {
     
     const {username, password} = await getUsernamePassword(cli)
     const client = new CognitoIdentityProviderClient({region})
     const resp: InitiateAuthCommandOutput = await initialAuthentication(client, username, password)
     if(resp.AuthenticationResult){
         printTokens(resp.AuthenticationResult);
     } else {
         const newPassword = await getNewPassword(cli)
         const resp2: InitiateAuthCommandOutput = await respondAuthentication(resp, client, username, newPassword)
         printTokens(resp2.AuthenticationResult)
     }
   } catch (error) {
       throw error
   }
    finally {
        cli.close()
    }
}
main().catch(err => {
    const errorMessage = err.message;
    console.error((err.$fault==="client" ? "client error: " : "server error: ") + errorMessage)
})

function getRegionClientId(): { region: string; clientId: string } {
    const region = process.env.REGION || "us-east-1"
    const clientId = process.env.CLIENT_ID
    if(!clientId) {
        throw Error("missing Client Id value")
    }
    return {region, clientId}
}
async function getUsernamePassword(cli: readline.Interface): Promise<{ username: any; password: any }> {
    const username:string = await promptLine(cli, "USERNAME: ")
    const password:string = await promptLine(cli, "PASSWORD: ")
    return {username, password}

}

async function promptLine(cli: readline.Interface, prompt: string): Promise<string> {
    const value:string = await cli.question(prompt)
    return (value ?? "").trim();
}

async function initialAuthentication(client: CognitoIdentityProviderClient, username: any, password: any): Promise<InitiateAuthCommandOutput> {
    const command = new InitiateAuthCommand({
       AuthFlow: "USER_PASSWORD_AUTH",
       ClientId: clientId,
       AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
       }
    })
    return client.send(command);
}

function printTokens(authenticationResult: AuthenticationResultType): void {
    console.log("access token: ",authenticationResult.AccessToken)
    console.log("_".repeat(N_UNDERSCIRES))
    console.log("id token: ", authenticationResult.IdToken)
    console.log("_".repeat(N_UNDERSCIRES))
    console.log("refresh token: ", authenticationResult.RefreshToken)
}
async function getNewPassword(cli: readline.Interface): Promise<string>{
    return promptLine(cli, "NEW PASSWORD: ")
}

async function respondAuthentication(resp: InitiateAuthCommandOutput, client: CognitoIdentityProviderClient, username: any, newPassword: string): Promise<InitiateAuthCommandOutput> {
    if (resp.ChallengeName != "NEW_PASSWORD_REQUIRED"){
        throw Error(`Unknow Challenge Name ${resp.ChallengeName}`)
    }

    const command = new RespondToAuthChallengeCommand({
       ChallengeName:"NEW_PASSWORD_REQUIRED",
       ClientId: clientId,
       Session: resp.Session,
       ChallengeResponses:{
        USERNAME: username,
        NEW_PASSWORD: newPassword
       }
    });
    return client.send(command)
}

