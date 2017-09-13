const config = require('./config.json')
const TelegramBot = require('./libs/telegram')
const Firebase = require('./libs/firebase')
const Functions = require('./libs/functions')

const {log, error} = Functions

const botId = config.TELEGRAM_BOT_ID
const groupsRef = Firebase.ref('/config/bot/groups')

const handleNewUser = (msg) => {
  const chat = msg.chat
  const from = msg.from
  const groupId = msg.chat.id
  const members = msg.new_chat_members

  if (members.length) {
    if (members.filter(item => item.id === botId).length) {
      const updates = {}
      if (from) {
        updates[from.id] = {
          added_at: 0,
          ...msg.from
        }
      }

      members.map(item => {
        updates[item.id] = {
          added_at: msg.date,
          ...item
        }
      })

      groupsRef.child(groupId).set({
        members: updates,
        ...chat
      })
      log("Group", groupId, "added")
    } else {
      const updates = {}
      members.map(item => {
        updates[groupId + "/members/" + item.id] = {
          added_at: msg.date,
          ...item
        }
      })

      groupsRef.update(updates)
      log("Group", groupId, members.length, "users added")
    }
  }
}

const handleDelUser = (msg) => {
  const groupId = msg.chat.id
  const member = msg.left_chat_member

  if (member.id === botId) {
    groupsRef.child(groupId).remove()
    log("Group", groupId, "removed")
  } else {
    const updates = {}
    updates[groupId + "/members/" + member.id] = null
    updates[groupId + "/membersRemoved/" + member.id] = {
      removed_at: msg.date,
      ...member
    }
    groupsRef.update(updates)
    log("Group", groupId, member.id, "removed")
  }
}

const handleNewGroup = (msg) => {
  const groupId = msg.chat.id
  const title = msg.chat.title
  groupsRef.child(groupId).set(msg.chat)
  log('Group created', groupId, title)
}

const handleMigrateGroup = (msg) => {
  const groupId = msg.chat.id
  const groupNewId = msg.chat.migrate_to_chat_id
  groupsRef.child(groupId).once('value', snap => {
    if (!groupNewId || !groupId) {
      return error('Migrated to group but id doesn\'t exists', JSON.stringify(msg))
    }
    const updates = {}
    updates[groupNewId] = snap.val()
    updates[groupId] = null
    groupsRef.update(updates)
    log(groupId, 'migrated to', groupNewId)
  })
}

const handleAll = (msg) => {
  if (msg.new_chat_members) handleNewUser(msg)
  else if (msg.left_chat_member) handleDelUser(msg)
  else if (msg.migrate_to_chat_id) handleMigrateGroup(msg)
  else if (msg.group_chat_created) handleNewGroup(msg)
  else if (!msg.text && !msg.sticker && !msg.reply_to_message) console.log(msg)
}

TelegramBot.on('message', handleAll)
// TelegramBot.on('group_chat_created', handleNewGroup)
// TelegramBot.on('new_chat_members', handleNewUser)
// TelegramBot.on('left_chat_member', handleDelUser)
// TelegramBot.on('migrate_to_chat_id', handleMigrateGroup)

log('Started...')
