import os
import json

def asList(string:str)->list[str]:
  forbidden = ["\t","\n","(",")","'"]
  for elem in forbidden:
    string = string.replace(elem,"")
  return string.split(",")[:-1]

path = os.path.join(os.getcwd(),"votes","snapshot-testnet-rinkeby.sql")
gg = os.popen(f'cat {path} | grep 0xda190be12ee7c48dbd5ed06d9b13c11ac50e3000c802956850bd96f3ca83bdb3').readlines()

votes=[]
yes_votes = 0
no_votes = 0
for r in gg:
  row = asList(r)
  if (len(row)==14): # length 14 indicates part of vote table, meaning it is a recorded vote
    votes.append({"voter":row[2],"vote":int(row[6]),"vote_weight":int(float(row[10]))})
    if int(row[6])==1:
      yes_votes += votes[-1]["vote_weight"]
    else:
      no_votes += votes[-1]["vote_weight"]
      
print("vote history:", votes)
print(f"Votes yes: {yes_votes} ({yes_votes/(yes_votes+no_votes)*100}%)")
print(f"Votes no: {no_votes} ({no_votes/(yes_votes+no_votes)*100}%)")

with open("votes/voteresult.json","w") as f:
  f.write(json.dumps(votes))
with open("votes/voteresult.txt","w") as f:
  f.write(f"Votes yes: {yes_votes} ({yes_votes/(yes_votes+no_votes)*100}%) \n Votes no: {no_votes} ({no_votes/(yes_votes+no_votes)*100}%)")