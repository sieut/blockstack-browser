import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { Person } from 'blockstack'

import SocialAccountItem from './components/SocialAccountItem'
import PGPAccountItem from './components/PGPAccountItem'
import Image from '../components/Image'
import { IdentityActions } from './store/identity'
import { SearchActions } from './store/search'

const placeholderImage = "https://s3.amazonaws.com/65m/avatar-placeholder.png"

function mapStateToProps(state) {
  return {
    currentIdentity: state.profiles.identity.current,
    localIdentities: state.profiles.identity.localIdentities,
    nameLookupUrl: state.settings.api.nameLookupUrl
  }
}

function mapDispatchToProps(dispatch) {
  let actions = Object.assign(IdentityActions, SearchActions)
  return bindActionCreators(actions, dispatch)
}

class ViewProfilePage extends Component {
  static propTypes = {
    fetchCurrentIdentity: PropTypes.func.isRequired,
    updateCurrentIdentity: PropTypes.func.isRequired,
    updateQuery: PropTypes.func.isRequired,
    currentIdentity: PropTypes.object.isRequired,
    localIdentities: PropTypes.object.isRequired,
    nameLookupUrl: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      currentIdentity: {
        id: null,
        profile: null,
        verifications: [],
        blockNumber: null,
        transactionNumber: null
      },
      isLoading: true
    }
    this.hasUsername = this.hasUsername.bind(this)
  }

  componentHasNewRouteParams(props) {
    if (props.routeParams.index) {
      const newDomainIndex = props.routeParams.index,
            profile = props.localIdentities[newDomainIndex].profile,
            name = props.localIdentities[newDomainIndex].domainName,
            verifications = []
      this.props.updateCurrentIdentity(name, profile, verifications)
    } else if (props.routeParams.name) {
      this.props.fetchCurrentIdentity(props.nameLookupUrl, props.routeParams.name)
    }
  }

  componentWillMount() {
    this.componentHasNewRouteParams(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.routeParams !== this.props.routeParams) {
      this.componentHasNewRouteParams(nextProps)
    }
    this.setState({
      currentIdentity: nextProps.currentIdentity,
      isLoading: false
    })
  }

  hasUsername() {
    const localIdentities = this.props.localIdentities
    const currentDomainName = this.state.currentIdentity.domainName
    return currentDomainName !== localIdentities[currentDomainName].ownerAddress
  }

  render() {
    const identity = this.state.currentIdentity

    const domainName = identity.domainName

    let profile = identity.profile || null,
        verifications = identity.verifications,
        blockNumber = identity.blockNumber,
        transactionIndex = identity.transactionIndex

    let isLocal = false
    if (this.props.routeParams.hasOwnProperty('index')) {
      isLocal = true
    }

    let person = null,
        accounts = [],
        connections = []

    if (profile !== null) {
      if (profile.hasOwnProperty('@type')) {
        person = new Person(profile)
      } else {
        person = Person.fromLegacyFormat(profile)
      }
      accounts = person.profile().account || []
      connections = person.connections() || []
    }

    return (
      <div>
        { person !== null ?
        <div>
          <div className="container-fluid pro-wrap m-t-50 profile-content-wrapper">
            <div className="col-sm-4">
              <div className="pro-container col-sm-12">
                <div className="pro-avatar m-b-20">
                  <Image src={person.avatarUrl() || ''}
                    fallbackSrc="/images/avatar.png" className="img-circle" />
                </div>
                <div className="">
                  { (blockNumber && transactionIndex) ?
                  <div className="idcard-body dim">
                    Registered in block <span>#{blockNumber}</span>,<br/>
                    transaction <span>#{transactionIndex}</span>
                  </div>
                  : null }
                  <h1 className="pro-card-name">{person.name()}</h1>
                  <div className="pro-card-body">
                    {person.description()}
                  </div>
                  { person.address() ?
                  <div className="pro-card-body">
                    {person.address()}
                  </div>
                  : null }
                  { person.birthDate() ?
                  <div className="pro-card-body">
                    {person.birthDate()}
                  </div>
                  : null }
                </div>
              </div>
              <div className="container">
                {connections.length ?
                <p className="profile-foot">Connections</p>
                : null }
                {connections.map((connection, index) => {
                  if (connection.id) {
                    return (
                      <Link to={`/profiles/blockchain/${connection.id}`}
                        key={index} className="connections">
                        <Image src={new Person(connection).avatarUrl()}
                          fallbackSrc={placeholderImage}
                          style={{ width: '40px', height: '40px' }} />
                      </Link>
                    )
                  }
                })}
              </div>
            </div>
            <div className="col-sm-8 pull-right profile-right-col-fill">
              <div className="profile-right-col">
                <h3>
                  {domainName}
                </h3>
                <ul>
                  {accounts.map(function(account) {
                    let verified = false
                    for(let i = 0; i < verifications.length; i++) {
                      let verification = verifications[i]
                      if(verification.service == account.service &&
                        verification.valid == true) {
                          verified = true
                          break
                      }
                    }
                    if (account.service === 'pgp') {
                      return (
                        <PGPAccountItem
                          key={account.service + '-' + account.identifier}
                          service={account.service}
                          identifier={account.identifier}
                          contentUrl={account.contentUrl}
                          listItem={true} />
                      )
                    } else {
                      return (
                        <SocialAccountItem
                          key={account.service + '-' + account.identifier}
                          service={account.service}
                          identifier={account.identifier}
                          proofUrl={account.proofUrl}
                          listItem={true}
                          verified={verified} />
                      )
                    }
                  })}
                </ul>
              </div>
            </div>
          </div>
          <div className="container-fluid profile-content-wrapper pro-actions-wrap">
            { isLocal ?
            <div>
                <Link to={`/profiles/${domainName}/edit`}
                  className="btn btn-lg btn-primary btn-black btn-inline btn-tight">
                  Edit
                </Link>
                {!this.hasUsername() ?
                  <button
                    className="btn btn-lg btn-primary btn-black btn-inline btn-tight"
                    disabled={true}
                    title="Add a username to view publicly."
                  >
                  View Publicly
                  </button>
                  :
                <Link to={`/profiles/${domainName}`}
                  className="btn btn-lg btn-primary btn-black btn-inline btn-tight">
                  View Publicly
                </Link>
                }
                {!this.hasUsername() ?
                  <Link to={`/profiles/i/register/${domainName}`}
                    className="btn btn-lg btn-primary btn-black btn-inline btn-tight">
                   Add a username
                  </Link>
                  :
                  null
                }
            </div>
            :
            <div>
              <button className="btn btn-lg btn-primary btn-black btn-tight">
                Add Friend
              </button>
            </div>
            }
          </div>
        </div>
        :
        <div>
          {this.state.isLoading ?
            <h4 className="text-xs-center">
            </h4>
          :
            <h4 className="text-xs-center">
              Profile not found
            </h4>
          }
        </div>
        }
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewProfilePage)

/*
  componentWillUnmount() {
    this.props.updateCurrentIdentity('', {}, [])
  }
*/
